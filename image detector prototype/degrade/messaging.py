"""Make a picture look like it was sent through a messaging app, to test what survives.

Run from inside "image detector prototype/":
    ../.venv/Scripts/python.exe -m degrade.messaging in.jpg out_folder/

Each condition takes the original file's bytes and returns new bytes plus a file ending:
    document         sent "as a document/file": the bytes are not touched
    whatsapp_like    long side down to 1600 px, JPEG quality 70, all details dropped
    telegram_like    long side down to 1280 px, JPEG quality 87, all details dropped
    screenshot       the picture shown on a phone screen and screenshotted (PNG, no details)
    crop_recompress  the middle 80% cut out and saved again as JPEG quality 85, details dropped
    keep_details     saved again as JPEG quality 85, but the EXIF and XMP details are copied over
                     (an app that keeps details; Pillow cannot copy content credentials)

IMPORTANT: the sizes and qualities are our ASSUMPTIONS, not measured from the apps. Whether
WhatsApp or Telegram really drop the details is exactly what the phone test (docs/phone_test.md)
must check. These conditions show what our checker does IF an app behaves like this.
Everything is deterministic: the same input always gives the same output.
"""
import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def _open(data):
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)        # turn it the right way up, as apps do
    return img.convert("RGB")


def _shrink(img, long_side):
    w, h = img.size
    scale = long_side / max(w, h)
    if scale < 1:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    return img


def _jpeg(img, quality, **extra):
    out = io.BytesIO()
    img.save(out, "JPEG", quality=quality, **extra)   # Pillow only keeps details if told to
    return out.getvalue()


def document(data):
    return data, None                          # None = keep the original file ending


def whatsapp_like(data):
    return _jpeg(_shrink(_open(data), 1600), 70), ".jpg"


def telegram_like(data):
    return _jpeg(_shrink(_open(data), 1280), 87), ".jpg"


def screenshot(data):
    """Show the picture on a 1080 x 2340 phone screen with app bars, then save as PNG."""
    screen = Image.new("RGB", (1080, 2340), (245, 245, 245))
    draw = ImageDraw.Draw(screen)
    draw.rectangle([0, 0, 1080, 220], fill=(18, 140, 126))       # a chat app's top bar
    draw.rectangle([0, 2140, 1080, 2340], fill=(230, 230, 230))  # the typing bar
    pic = _shrink(_open(data), 1000)
    screen.paste(pic, ((1080 - pic.width) // 2, 400))
    out = io.BytesIO()
    screen.save(out, "PNG")
    return out.getvalue(), ".png"


def crop_recompress(data):
    img = _open(data)
    w, h = img.size
    box = (w // 10, h // 10, w - w // 10, h - h // 10)
    return _jpeg(img.crop(box), 85), ".jpg"


def keep_details(data):
    """Saved again, but with the EXIF and XMP details copied (if the original had any)."""
    original = Image.open(io.BytesIO(data))
    extra = {}
    if original.info.get("exif"):
        extra["exif"] = original.info["exif"]
    xmp = original.info.get("xmp") or original.info.get("XML:com.adobe.xmp")
    if xmp:
        extra["xmp"] = xmp.encode("utf-8") if isinstance(xmp, str) else xmp
    return _jpeg(original.convert("RGB"), 85, **extra), ".jpg"


CONDITIONS = {
    "document": document,
    "whatsapp_like": whatsapp_like,
    "telegram_like": telegram_like,
    "screenshot": screenshot,
    "crop_recompress": crop_recompress,
    "keep_details": keep_details,
}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python -m degrade.messaging in.jpg out_folder/")
    source, folder = Path(sys.argv[1]), Path(sys.argv[2])
    folder.mkdir(parents=True, exist_ok=True)
    for name, make in CONDITIONS.items():
        data, ending = make(source.read_bytes())
        target = folder / f"{source.stem}_{name}{ending or source.suffix}"
        target.write_bytes(data)
        print("wrote", target)
