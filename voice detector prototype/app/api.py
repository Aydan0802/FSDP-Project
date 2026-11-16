"""
api.py - a small local web API so the website's "Check anything" screen can use the voice detector.

The website (plain HTML/JS) sends a voice recording here, and gets back the result in the shape
its screen already shows (the five shared results: likely / partial / uncertain / unsure / real).

    POST /api/voice/check?ext=m4a   body = the recording's bytes   -> the result (JSON)
    POST /api/voice/sample                                         -> the result for our sample clip
    GET  /api/voice/health                                         -> {"ok": true} once the model is loaded

It can also serve the website itself (--site), so one address gives both the website and the
voice checker. That is what the booth uses: a tunnel gives this laptop a public link, and
visitors' phones open the website and use the voice checker through it.

Safety:
  - Listens on this computer only (127.0.0.1). A tunnel (see app/start_booth.ps1) is the only
    way in from outside, and only while it runs.
  - Only the website itself may call the API: pages on this computer, plus any site named with
    --allow-origin (for example the team's Vercel link). Browsers enforce this (CORS).
  - The website files are served read-only, web files only (pages, scripts, styles, images);
    hidden files and the detector, model, data and download folders are never served.
  - The recording is written to a temporary folder, checked, and deleted straight away. Nothing is kept.
  - Upload only: it never records anyone.
  - Python's standard library only (no web framework to install).

Run from inside "voice detector prototype/":
    python -m app.api                                   (the voice checker only, for local testing)
    python -m app.api --site "<website folder>" --allow-origin https://<our-site>.vercel.app
"""
import argparse
import json
import mimetypes
import re
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import numpy as np

from detectors.forensics_xlsr import MIN_SECONDS, SR, WINDOW_S, load_audio
from detectors.verdict import PART_WINDOW, SHORT_CLIP_S, analyse

HOST, PORT = "127.0.0.1", 7861
MAX_BYTES = 25 * 1024 * 1024        # the biggest recording we accept (25 MB)
ROOT = Path(__file__).resolve().parent.parent
# The "Sample voice message" button: one of our own synthetic test clips (Piper TTS, a free
# open-source voice reading a public-domain sentence). It lives in data/ (git-ignored), so on a
# computer without it the website falls back to its demo result.
SAMPLE_CLIP = next(iter(sorted((ROOT / "data" / "fake_tts" / "piper").glob("*.wav"))), None)
# Pages allowed to call this API: the website running on this computer, on any port, plus the
# sites given with --allow-origin when the server starts (EXTRA_ORIGINS)
LOCAL_ORIGIN = re.compile(r"^http://(localhost|127\.0\.0\.1)(:\d+)?$")
EXTRA_ORIGINS = set()

# --site: the website folder to serve at "/" (None = the voice checker only)
SITE_ROOT = None
# Only these kinds of file are served from the website folder
WEB_FILES = {".html", ".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
             ".woff", ".woff2", ".webmanifest"}
# Never served, even if they are inside the website folder
BLOCKED_FOLDERS = {"voice detector prototype", "node_modules", "downloads", "models", "results",
                   "server", "docs"}

# The model is not safe to use from two requests at once, so voice checks take turns
# (each takes under a second on this laptop's graphics card)
MODEL_LOCK = threading.Lock()


# ---------- Reading the recording ----------

def read_recording(data, ext):
    """Bytes of an audio or video file -> 16 kHz mono audio. Phone recordings are often .m4a or
    .amr, which the normal reader can't open, so those are converted with ffmpeg first."""
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / f"clip.{ext}"
        path.write_bytes(data)
        try:
            return load_audio(path)
        except Exception:
            import imageio_ffmpeg  # bundled ffmpeg (in requirements.txt)
            wav_path = Path(folder) / "clip.wav"
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(path),
                            "-ac", "1", "-ar", str(SR), str(wav_path)], check=True, timeout=60)
            return load_audio(wav_path)
    # the temporary folder (and the recording) is deleted when the "with" block ends


# ---------- The detector's answer -> what the website shows ----------

def window_starts(duration, n_windows, hop):
    """Where each of the detector's 5 s windows starts (seconds). They start every 2.5 s, but the
    last one is lined up with the end of the clip (see make_windows in forensics_xlsr.py)."""
    if duration <= WINDOW_S:
        return [0.0]
    starts = [i * hop for i in range(n_windows)]
    if starts[-1] + WINDOW_S > duration + 1e-6:
        starts[-1] = duration - WINDOW_S
    return starts


def timeline(r):
    """The clip in 5-second pieces (0-5 s, 5-10 s, ...), each marked AI-made or not. Each piece
    uses the detector window that lines up with it best (the one starting closest to it)."""
    chances = r.get("window_chances") or []
    if not chances:
        return []
    duration = r["duration_s"]
    starts = window_starts(duration, len(chances), r.get("window_hop_s") or 2.5)
    pieces = []
    piece_start = 0.0
    while piece_start < duration - 0.05:
        target = min(piece_start, max(0.0, duration - WINDOW_S))
        best = min(range(len(starts)), key=lambda i: abs(starts[i] - target))
        pieces.append({"start": round(piece_start, 1), "end": round(min(piece_start + WINDOW_S, duration), 1),
                       "ai": chances[best] >= PART_WINDOW})
        piece_start += WINDOW_S
    return pieces


def partial_reason(pieces):
    """The "part of it sounds fake" reason: which seconds (first to last flagged piece)."""
    flagged = [p for p in pieces if p["ai"]]
    if not flagged:
        return {"key": "partialSome"}
    return {"key": "partial", "from": flagged[0]["start"], "to": flagged[-1]["end"]}


def for_website(r):
    """Turns analyse()'s result into the website's result: which of the five shared results it
    is, the chance, how sure we are, and the reasons.

    Reasons are short codes with values, e.g. {"key": "short", "seconds": 3.2}, not sentences:
    the website words them in the language the customer picked ("an.vr.short" in
    js/data/analyser.js). reasons: short and plain, for older customers. details: the more
    technical points, which the website folds away under "More details"."""
    if r["likelihood_pct"] is None:  # AudioSeal watermark found
        return {"result": "likely", "watermark": True, "chance": None, "sure": "High", "timeline": None,
                "reasons": [{"key": "watermark"}], "details": [{"key": "watermarkFound"}],
                "detail": {k: r[k] for k in ("verdict", "band", "watermark_score")}}

    band, duration = r["band"], r["duration_s"]
    pieces = timeline(r)
    if band == "HIGH":
        key = "likely"
    elif band == "MEDIUM" and r["part_synthetic"]:
        key = "partial"
    elif band == "MEDIUM":
        key = "uncertain"
    elif band == "INCONCLUSIVE":
        key = "unsure"
    else:
        key = "real"

    reasons = [partial_reason(pieces) if key == "partial" else {"key": key}]
    if duration < MIN_SECONDS:
        reasons.append({"key": "tooShort", "seconds": duration})
    elif duration < SHORT_CLIP_S:
        reasons.append({"key": "short", "seconds": duration})
    if r["channel"] == "phone":
        reasons.append({"key": "phone"})
    if r["parts_disagree"]:
        reasons.append({"key": "disagree"})

    details = [{"key": "noWatermark"},
               {"key": "audio", "type": r["channel"], "seconds": duration},
               {"key": "windows", "n": r["n_flagged"], "of": r["n_windows"]}]

    return {
        "result": key,
        "watermark": False,
        # No number when the detector can't tell: a number would look more certain than it is
        "chance": None if key == "unsure" else r["likelihood_pct"],
        # "Not sure" with "How sure we are: Medium" would contradict itself, so unsure is always Low
        "sure": "Low" if key == "unsure" else r["confidence"].capitalize(),
        "reasons": reasons,
        "details": details,
        "timeline": pieces if len(pieces) >= 2 else None,
        "detail": {k: r[k] for k in ("verdict", "band", "likelihood_pct", "confidence", "channel", "duration_s")},
    }


# ---------- The web server ----------

def site_file(url_path):
    """The website file for an address like /js/features/analyser.js, or None if it doesn't
    exist or must not be served (see WEB_FILES and BLOCKED_FOLDERS)."""
    if SITE_ROOT is None:
        return None
    relative = unquote(url_path).lstrip("/") or "index.html"
    parts = Path(relative).parts
    if any(p.startswith(".") or p.lower() in BLOCKED_FOLDERS for p in parts):
        return None
    path = (SITE_ROOT / relative).resolve()
    if SITE_ROOT not in path.parents or not path.is_file() or path.suffix.lower() not in WEB_FILES:
        return None
    return path


class Handler(BaseHTTPRequestHandler):
    def cors(self):
        origin = self.headers.get("Origin", "")
        if LOCAL_ORIGIN.match(origin) or origin in EXTRA_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            # ngrok-skip-browser-warning: the website sends it so the tunnel's "are you sure?"
            # page (shown to first-time browser visitors) is skipped for these API calls
            self.send_header("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning")
            self.send_header("Vary", "Origin")

    def reply(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):  # the browser asks first before sending a file from another port
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/voice/health":
            return self.reply(200, {"ok": True, "sample": SAMPLE_CLIP is not None})
        file = site_file(path)
        if file is None:
            return self.reply(404, {"error": "Not found"})
        data = file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(file.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")   # so a git pull shows up straight away
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        url = urlparse(self.path)
        try:
            # Errors carry a short "code" the website turns into words in the customer's language
            if url.path == "/api/voice/sample":
                if SAMPLE_CLIP is None:
                    return self.reply(404, {"code": "noSample", "error": "No sample clip on this computer."})
                wav = load_audio(SAMPLE_CLIP)
            elif url.path == "/api/voice/check":
                size = int(self.headers.get("Content-Length") or 0)
                if size <= 0:
                    return self.reply(400, {"code": "noSound", "error": "No recording was sent."})
                if size > MAX_BYTES:
                    return self.reply(413, {"code": "tooBig", "error": "This recording is too big. Please use one under 25 MB."})
                ext = parse_qs(url.query).get("ext", ["wav"])[0].lower()
                if not re.fullmatch(r"[a-z0-9]{1,5}", ext):  # only a plain file ending, nothing else
                    ext = "wav"
                wav = read_recording(self.rfile.read(size), ext)
            else:
                return self.reply(404, {"error": "Not found"})
        except Exception as e:  # unreadable or broken file
            print("Could not read the recording:", e)
            return self.reply(422, {"code": "unreadable", "error": "We couldn't read this recording."})
        if len(wav) == 0 or not np.isfinite(wav).all():
            return self.reply(422, {"code": "noSound", "error": "This recording has no sound we can check."})
        with MODEL_LOCK:
            result = for_website(analyse(wav))
        self.reply(200, result)

    def log_message(self, fmt, *args):  # one short line per request, no file contents
        path = urlparse(self.path).path
        if path.startswith("/api/"):   # website files are not logged, to keep the screen readable
            print(f"{self.command} {path} -> {args[1] if len(args) > 1 else ''}")


class Server(ThreadingHTTPServer):
    # A phone opening the website asks for about 45 files at once. The default waiting line (5)
    # turns most of them away, which the tunnel shows as "502" errors, so allow a longer line.
    request_queue_size = 128


def main():
    global SITE_ROOT
    parser = argparse.ArgumentParser(description="The voice checker for the website (and, with --site, the website too)")
    parser.add_argument("--site", help="the website folder to serve at / (the folder with index.html)")
    parser.add_argument("--allow-origin", action="append", default=[],
                        help="another site allowed to use the voice checker, e.g. https://our-site.vercel.app (repeatable)")
    args = parser.parse_args()
    if args.site:
        SITE_ROOT = Path(args.site).resolve()
        if not (SITE_ROOT / "index.html").is_file():
            parser.error(f"no index.html in {SITE_ROOT}")
    EXTRA_ORIGINS.update(origin.rstrip("/") for origin in args.allow_origin)

    print("Loading the voice detector (the first time takes a little while)...")
    analyse(np.zeros(int(SR * MIN_SECONDS * 2), dtype=np.float32))  # loads the model now, not on the first check
    print(f"Voice checker ready on http://{HOST}:{PORT}  (sample clip: {SAMPLE_CLIP.name if SAMPLE_CLIP else 'none'})")
    if SITE_ROOT:
        print(f"Website served from {SITE_ROOT} at http://{HOST}:{PORT}/")
    if EXTRA_ORIGINS:
        print("Also allowed to use the voice checker:", ", ".join(sorted(EXTRA_ORIGINS)))
    Server((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
