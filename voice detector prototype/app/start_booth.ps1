# start_booth.ps1 - starts the booth setup on the team laptop:
#   1. the voice checker, which also serves the website (app/api.py --site ...)
#   2. the ngrok tunnel, which gives this laptop a fixed public link for visitors' phones
#      (and for the Vercel site, if the team deploys one)
#
# Run it from inside "voice detector prototype":
#   powershell -ExecutionPolicy Bypass -File app\start_booth.ps1
# Two windows open (the voice checker and the tunnel). Close both to stop.
#
# Before the first run (once):
#   - install ngrok, then run  ngrok config add-authtoken <your token>  yourself
#   - claim your free fixed address on the ngrok dashboard and put it in $PublicDomain below
#   - put the same address in voiceApiPublic in js/data/analyser.js: "https://<address>/api/voice"
# During the event: keep the laptop plugged in, with sleep turned off and
# "when I close the lid: do nothing" (closing the lid freezes running programs on this laptop).

# ---------- Fill these in ----------
$PublicDomain = "stagnant-powdered-playing.ngrok-free.dev"   # the team's free fixed ngrok address
$VercelSite   = ""   # the team's Vercel link, e.g. "https://verify-the-caller.vercel.app" ("" if none yet)
$SiteFolder   = ".claude\worktrees\detectors-in-analyser"   # the website folder, from the project root
# -----------------------------------

$ErrorActionPreference = "Stop"
$detector = Split-Path -Parent $PSScriptRoot           # "voice detector prototype"
$root     = Split-Path -Parent $detector               # the project root
$python   = Join-Path $root ".venv\Scripts\python.exe"
$site     = Join-Path $root $SiteFolder

if (-not (Test-Path (Join-Path $site "index.html"))) { throw "No website (index.html) in $site. Check `$SiteFolder." }

# Start-Process joins its arguments with spaces, so paths with spaces need quotes around them
function Quote($text) { '"' + $text + '"' }

# 1. The voice checker, serving the website too
$apiArgs = @("-m", "app.api", "--site", (Quote $site))
if ($VercelSite) { $apiArgs += @("--allow-origin", $VercelSite) }
Start-Process -FilePath $python -ArgumentList $apiArgs -WorkingDirectory $detector

Write-Host "Loading the voice checker (about a minute)..."
$ready = $false
for ($i = 0; $i -lt 90 -and -not $ready; $i++) {
  try { Invoke-RestMethod "http://127.0.0.1:7861/api/voice/health" | Out-Null; $ready = $true }
  catch { Start-Sleep -Seconds 2 }
}
if (-not $ready) { throw "The voice checker did not start. Look at its window for the error." }
Write-Host "Voice checker ready. On this laptop: http://127.0.0.1:7861/"

# 2. The tunnel to the fixed public address
if (-not $PublicDomain) {
  Write-Host "No `$PublicDomain yet, so no public link. Only this laptop can use it for now."
  exit
}
# 127.0.0.1, not "localhost": the voice checker only listens on the IPv4 address
Start-Process -FilePath "ngrok" -ArgumentList @("http", "127.0.0.1:7861", "--url", "https://$PublicDomain")
Write-Host ""
Write-Host "Booth link for visitors' phones: https://$PublicDomain/"
Write-Host "(Open it once yourself on a phone to check it works.)"
