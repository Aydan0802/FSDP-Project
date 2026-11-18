"""Make the test images for the image checker, each carrying one kind of AI label.

Run from inside "image detector prototype/":
    ../.venv/Scripts/python.exe tests/make_fixtures.py

Every picture is a drawn test pattern that says "TEST PICTURE" on it: no photos, no people, nothing
made by a real AI tool. We then add the labels that AI tools are known to write (an IPTC label,
Stable Diffusion settings, a tool name, signed content credentials), so the checker can be tested.
These copy the FORMAT of real labels; they are not real AI images.

Signed content credentials use the C2PA project's public TEST certificate
(downloads/c2pa_test_certs/, from github.com/contentauth/c2pa-python, tests/fixtures/). It is not
trusted by anyone, so a checker must report the signer as unconfirmed. Three official C2PA test
photos (downloads/c2pa_public_testfiles/, CC-BY-SA-4.0) are copied in as well.

Output: data/fixtures/*.jpg|png|webp and data/fixtures/expected.json, a list of
    {"file", "source", "label", "band", "result"}
where label is what the file really carries ("ai", "ai_edit" or "none"), and band/result are what
the checker should say in Node (where the C2PA signature is not checked).
"""
import io
import json
import shutil
from pathlib import Path

import c2pa
from PIL import Image, ImageDraw
from PIL.PngImagePlugin import PngInfo

HERE = Path(__file__).resolve().parent.parent          # image detector prototype/
OUT = HERE / "data" / "fixtures"
CERTS = HERE / "downloads" / "c2pa_test_certs"
PUBLIC = HERE / "downloads" / "c2pa_public_testfiles"
IPTC = "http://cv.iptc.org/newscodes/digitalsourcetype/"


def test_picture(seed=0):
    """A clearly synthetic picture: a colour gradient, some shapes and the words TEST PICTURE."""
    img = Image.new("RGB", (768, 512))
    draw = ImageDraw.Draw(img)
    for y in range(512):                                       # gradient background
        draw.line([(0, y), (767, y)], fill=(40 + y // 4, 90 + seed * 20, 200 - y // 4))
    draw.ellipse([80, 120, 300, 340], fill=(240, 200, 60))
    draw.rectangle([420, 160, 680, 400], fill=(220, 80, 90))
    draw.text((40, 30), "TEST PICTURE - drawn by a script, not a camera or an AI", fill="white")
    return img


def xmp_label(source_type):
    """An XMP block with the IPTC digital source type, written the way Google and Meta do."""
    return (
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        '<rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '
        f'Iptc4xmpExt:DigitalSourceType="{IPTC}{source_type}"/></rdf:RDF></x:xmpmeta>'
    ).encode("utf-8")


def exif_with(software=None, make=None, model=None, user_comment=None):
    exif = Image.Exif()
    if make: exif[0x010F] = make
    if model: exif[0x0110] = model
    if software: exif[0x0131] = software
    if user_comment:
        # EXIF comments start with an 8-byte name of the text's encoding
        exif.get_ifd(0x8769)[0x9286] = b"UNICODE\0" + user_comment.encode("utf-16-be")
    return exif


def sign_c2pa(img, fmt, source_type, title):
    """Save the picture with signed content credentials saying how it was made."""
    mime = {"JPEG": "image/jpeg", "PNG": "image/png"}[fmt]
    plain = io.BytesIO()
    img.save(plain, fmt)
    plain.seek(0)
    manifest = {
        "claim_generator_info": [{"name": "FSDP image checker test script", "version": "1.0"}],
        "title": title,
        "assertions": [{
            "label": "c2pa.actions",
            "data": {"actions": [{"action": "c2pa.created", "digitalSourceType": IPTC + source_type}]},
        }],
    }
    info = c2pa.C2paSignerInfo(
        alg=c2pa.C2paSigningAlg.ES256,
        sign_cert=(CERTS / "es256_certs.pem").read_bytes(),
        private_key=(CERTS / "es256_private.key").read_bytes(),
        ta_url=None,                       # no timestamp server: works offline
    )
    signed = io.BytesIO()
    with c2pa.Signer.from_info(info) as signer, c2pa.Builder(manifest) as builder:
        builder.sign(signer, mime, plain, signed)
    return signed.getvalue()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    expected = []

    def add(name, data_or_writer, source, label, band, result):
        path = OUT / name
        if callable(data_or_writer):
            data_or_writer(path)
        else:
            path.write_bytes(data_or_writer)
        expected.append({"file": name, "source": source, "label": label, "band": band, "result": result})

    pic = test_picture()

    # ---- Controls: no AI label at all (the checker must say "unsure", never "real") ----
    add("plain.jpg", lambda p: pic.save(p, "JPEG", quality=90), "control", "none", "INCONCLUSIVE", "unsure")
    add("plain.png", lambda p: pic.save(p, "PNG"), "control", "none", "INCONCLUSIVE", "unsure")
    add("camera_exif.jpg", lambda p: pic.save(p, "JPEG", quality=90,
        exif=exif_with(make="TestCam", model="Model 1", software="Camera 1.0")), "control", "none", "INCONCLUSIVE", "unsure")
    add("photoshop_exif.jpg", lambda p: pic.save(p, "JPEG", quality=90,
        exif=exif_with(software="Adobe Photoshop 26.0")), "control", "none", "INCONCLUSIVE", "unsure")

    # ---- The IPTC "made by AI" / "changed with AI" label ----
    add("ai_xmp_label.jpg", lambda p: pic.save(p, "JPEG", quality=90, xmp=xmp_label("trainedAlgorithmicMedia")),
        "made_label", "ai", "HIGH", "likely")
    add("ai_edit_xmp_label.jpg", lambda p: pic.save(p, "JPEG", quality=90, xmp=xmp_label("compositeWithTrainedAlgorithmicMedia")),
        "made_label", "ai_edit", "MEDIUM", "partial")
    png_xmp = PngInfo()
    png_xmp.add_itxt("XML:com.adobe.xmp", xmp_label("trainedAlgorithmicMedia").decode("utf-8"))
    add("ai_xmp_label.png", lambda p: pic.save(p, "PNG", pnginfo=png_xmp), "made_label", "ai", "HIGH", "likely")
    add("ai_xmp_label.webp", lambda p: pic.save(p, "WEBP", quality=90, xmp=xmp_label("trainedAlgorithmicMedia")),
        "made_label", "ai", "HIGH", "likely")

    # ---- Image-generator settings (harmless made-up settings) ----
    sd = PngInfo()
    sd.add_text("parameters", "a red cube on a blue table\nNegative prompt: blurry\n"
                "Steps: 20, Sampler: Euler a, CFG scale: 7, Seed: 1, Size: 768x512, Model: test")
    add("ai_sd_parameters.png", lambda p: pic.save(p, "PNG", pnginfo=sd), "made_label", "ai", "HIGH", "likely")
    comfy = PngInfo()
    comfy.add_text("prompt", json.dumps({"3": {"class_type": "KSampler", "inputs": {"seed": 1, "steps": 20}}}))
    add("ai_comfyui_prompt.png", lambda p: pic.save(p, "PNG", pnginfo=comfy), "made_label", "ai", "HIGH", "likely")
    add("ai_sd_usercomment.jpg", lambda p: pic.save(p, "JPEG", quality=90, exif=exif_with(
        user_comment="a red cube\nNegative prompt: blurry\nSteps: 20, Sampler: Euler a, CFG scale: 7, Seed: 1")),
        "made_label", "ai", "HIGH", "likely")

    # ---- An AI tool's name in the EXIF Software field (weak evidence) ----
    add("ai_toolname.jpg", lambda p: pic.save(p, "JPEG", quality=90, exif=exif_with(software="Midjourney")),
        "made_label", "ai", "HIGH", "likely")

    # ---- Signed content credentials (test certificate) ----
    add("ai_c2pa_signed.jpg", sign_c2pa(pic, "JPEG", "trainedAlgorithmicMedia", "ai_c2pa_signed.jpg"),
        "made_c2pa", "ai", "HIGH", "likely")
    add("ai_c2pa_signed.png", sign_c2pa(pic, "PNG", "trainedAlgorithmicMedia", "ai_c2pa_signed.png"),
        "made_c2pa", "ai", "HIGH", "likely")
    add("ai_edit_c2pa_signed.jpg", sign_c2pa(test_picture(1), "JPEG", "compositeWithTrainedAlgorithmicMedia",
        "ai_edit_c2pa_signed.jpg"), "made_c2pa", "ai_edit", "MEDIUM", "partial")
    add("camera_c2pa_signed.jpg", sign_c2pa(test_picture(2), "JPEG", "digitalCapture", "camera_c2pa_signed.jpg"),
        "made_c2pa", "none", "INCONCLUSIVE", "unsure")

    # ---- Official C2PA test photos (real credentials, none say AI) ----
    for name in ["adobe-20220124-C.jpg", "adobe-20220124-E-sig-CA.jpg", "truepic-20230212-camera.jpg"]:
        if (PUBLIC / name).exists():
            shutil.copy(PUBLIC / name, OUT / name)
            expected.append({"file": name, "source": "public_c2pa", "label": "none", "band": "INCONCLUSIVE", "result": "unsure"})
        else:
            print(f"skipped {name}: not in {PUBLIC} (see README to download)")

    (OUT / "expected.json").write_text(json.dumps(expected, indent=2))
    print(f"wrote {len(expected)} test images to {OUT}")


if __name__ == "__main__":
    main()
