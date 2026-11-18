"use strict";

// Tests for the image checker. Run from inside "image detector prototype/":
//   node --test "tests/*.test.js"
// Most tests build tiny made-up files in memory (just the blocks the checker reads, no real
// picture), so they need nothing downloaded. The last test also checks the test images made by
// tests/make_fixtures.py, if they exist (data/fixtures/expected.json).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { readMetadata, detectFormat } = require("../detector/metadata.js");
const { checkImage, REASON_TEXT } = require("../detector/checker.js");

// ---------- Tiny made-up files ----------

const bytes = (s) => Uint8Array.from(Buffer.from(s, "latin1"));
const utf8 = (s) => Uint8Array.from(Buffer.from(s, "utf8"));
const concat = (...parts) => Uint8Array.from(Buffer.concat(parts.map(p => Buffer.from(p))));

// JPEG: start marker, segments, then "picture data starts" and end marker
function jpeg(...segments) {
  return concat(bytes("\xff\xd8"), ...segments, bytes("\xff\xda\x00\x02\xff\xd9"));
}
function segment(marker, data) {
  const len = data.length + 2;
  return concat(Uint8Array.of(0xff, marker, len >> 8, len & 0xff), data);
}
// PNG: signature, chunks (checksums are not read, so they are zeros), end chunk
function png(...chunks) {
  return concat(bytes("\x89PNG\r\n\x1a\n"), chunk("IHDR", new Uint8Array(13)), ...chunks, chunk("IEND", new Uint8Array(0)));
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  return concat(len, bytes(type), data, new Uint8Array(4));
}
// WebP: "RIFF", size, "WEBP", chunks
function webp(...chunks) {
  const body = concat(bytes("WEBP"), ...chunks);
  const size = Buffer.alloc(4); size.writeUInt32LE(body.length);
  return concat(bytes("RIFF"), size, body);
}
function webpChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32LE(data.length);
  return concat(bytes(type), len, data, data.length % 2 ? new Uint8Array(1) : new Uint8Array(0));
}

const IPTC = "http://cv.iptc.org/newscodes/digitalsourcetype/";
const xmpText = (sourceType) =>
  `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF><rdf:Description Iptc4xmpExt:DigitalSourceType="${IPTC}${sourceType}"/></rdf:RDF></x:xmpmeta>`;
const jpegXmp = (sourceType) => segment(0xe1, concat(bytes("http://ns.adobe.com/xap/1.0/\0"), utf8(xmpText(sourceType))));
// A stand-in for content credentials: a JUMBF box labelled "c2pa" holding a source type
const c2paBytes = (sourceType) => utf8(`JP\0\x01\0\0\0\x01....jumb....jumdc2pa\0....c2pa.actions..digitalSourceType${IPTC}${sourceType}`);
// An EXIF block holding some text (the checker searches the whole block)
const exifWith = (text) => segment(0xe1, concat(bytes("Exif\0\0MM\0*"), text));

// ---------- Tests ----------

test("file types are told apart by their first bytes, not their names", () => {
  assert.equal(detectFormat(jpeg()), "jpeg");
  assert.equal(detectFormat(png()), "png");
  assert.equal(detectFormat(webp()), "webp");
  assert.equal(detectFormat(bytes("GIF89a")), "gif");
  assert.equal(detectFormat(bytes("\0\0\0\x18ftypheic")), "heic");
  assert.equal(detectFormat(bytes("hello")), "unknown");
});

test("a picture with no details at all is inconclusive, never 'real'", () => {
  const r = checkImage(jpeg(), { fileName: "IMG-20261117-WA0003.jpg" });
  assert.equal(r.band, "INCONCLUSIVE");
  assert.equal(r.result, "unsure");
  assert.equal(r.likelihood_pct, null);
  const keys = r.reasons.map(x => x.key);
  for (const key of ["none_found", "stripped", "via_whatsapp", "synthid"]) assert.ok(keys.includes(key), key);
});

test("the IPTC 'made by AI' label in XMP is found, at medium confidence (it isn't signed)", () => {
  const r = checkImage(jpeg(jpegXmp("trainedAlgorithmicMedia")));
  assert.equal(r.band, "HIGH");
  assert.equal(r.result, "likely");
  assert.equal(r.confidence, "medium");
  assert.deepEqual(r.reasons[0], { key: "label_ai", where: "xmp" });
});

test("'changed with AI' is partial, and is not mistaken for 'made by AI'", () => {
  const r = checkImage(jpeg(jpegXmp("compositeWithTrainedAlgorithmicMedia")));
  assert.equal(r.band, "MEDIUM");
  assert.equal(r.result, "partial");
  assert.deepEqual(readMetadata(jpeg(jpegXmp("compositeWithTrainedAlgorithmicMedia"))).labels.map(l => l.sourceType), ["ai_edit"]);
});

test("a camera label alone does not count as evidence either way", () => {
  const r = checkImage(jpeg(jpegXmp("digitalCapture")));
  assert.equal(r.band, "INCONCLUSIVE");
});

test("PNG settings notes from Stable Diffusion web UIs and ComfyUI are found", () => {
  const sd = png(chunk("tEXt", bytes("parameters\0a red cube\nSteps: 20, Sampler: Euler a, CFG scale: 7")));
  assert.match(checkImage(sd).details.generator.tool, /Stable Diffusion/);
  // ComfyUI's note, compressed: only the keyword can be read, and that is enough
  const comfy = png(chunk("zTXt", concat(bytes("prompt\0\0"), Uint8Array.of(0x78, 0x9c, 1, 2, 3))));
  const r = checkImage(comfy);
  assert.equal(r.band, "HIGH");
  assert.equal(r.details.generator.tool, "ComfyUI");
});

test("an XMP label inside a PNG iTXt note is found", () => {
  const itxt = concat(bytes("XML:com.adobe.xmp\0\0\0\0\0"), utf8(xmpText("trainedAlgorithmicMedia")));
  const r = checkImage(png(chunk("iTXt", itxt)));
  assert.deepEqual(r.reasons[0], { key: "label_ai", where: "xmp" });
});

test("Stable Diffusion settings in a JPEG's EXIF comment (UTF-16) are found", () => {
  const words = "Negative prompt: blurry\nSteps: 20, Sampler: Euler a, CFG scale: 7";
  const comment = concat(bytes("UNICODE\0"), Buffer.from(words, "utf16le"));
  const r = checkImage(jpeg(exifWith(comment)));
  assert.equal(r.result, "likely");
  assert.equal(r.reasons[0].key, "generator");
});

test("an AI tool's name is weak evidence (low confidence), matched as a whole word", () => {
  const r = checkImage(jpeg(exifWith(bytes("Software\0Midjourney\0"))));
  assert.equal(r.band, "HIGH");
  assert.equal(r.confidence, "low");
  assert.deepEqual(r.reasons[0], { key: "tool_name", name: "Midjourney" });
  // Ordinary software, and words that only contain a name, do not count
  assert.equal(checkImage(jpeg(exifWith(bytes("Adobe Photoshop 26.0")))).band, "INCONCLUSIVE");
  assert.equal(checkImage(jpeg(exifWith(bytes("Geminids meteor shower")))).band, "INCONCLUSIVE");
});

test("content credentials saying 'AI', without a signature check, count like a label", () => {
  const file = jpeg(segment(0xeb, c2paBytes("trainedAlgorithmicMedia")));
  const r = checkImage(file);
  assert.equal(r.band, "HIGH");
  assert.equal(r.confidence, "medium");
  assert.deepEqual(r.reasons.map(x => x.key).slice(0, 2), ["c2pa_ai", "c2pa_unchecked"]);
});

test("checked content credentials: signed = high confidence, broken = lower", () => {
  const file = jpeg(segment(0xeb, c2paBytes("trainedAlgorithmicMedia")));
  const signed = checkImage(file, { c2pa: { state: "Valid", sourceTypes: ["ai"], tool: "Test tool", signer: "Test signer", trusted: false } });
  assert.equal(signed.confidence, "high");
  assert.equal(signed.reasons[1].key, "c2pa_signed");
  const broken = checkImage(file, { c2pa: { state: "Invalid", sourceTypes: ["ai"], tool: "", signer: "", trusted: false } });
  assert.equal(broken.band, "HIGH");
  assert.equal(broken.confidence, "medium");
  // Broken credentials that don't mention AI: be careful, but it is not a finding of AI
  const plain = jpeg(segment(0xeb, c2paBytes("digitalCapture")));
  const tampered = checkImage(plain, { c2pa: { state: "Invalid", sourceTypes: ["camera"], tool: "", signer: "", trusted: false } });
  assert.equal(tampered.result, "uncertain");
  assert.equal(tampered.confidence, "low");
});

test("valid camera credentials are mentioned, but the result stays inconclusive", () => {
  const file = jpeg(segment(0xeb, c2paBytes("digitalCapture")));
  const r = checkImage(file, { c2pa: { state: "Valid", sourceTypes: ["camera"], tool: "Camera app", signer: "", trusted: false } });
  assert.equal(r.band, "INCONCLUSIVE");
  assert.deepEqual(r.reasons.slice(0, 2).map(x => x.key), ["c2pa_no_ai", "c2pa_camera"]);
});

test("WebP details are read too", () => {
  const r = checkImage(webp(webpChunk("XMP ", utf8(xmpText("trainedAlgorithmicMedia")))));
  assert.equal(r.result, "likely");
});

test("formats we can't walk (HEIC) are searched as a whole", () => {
  const heic = concat(bytes("\0\0\0\x18ftypheic\0\0\0\0mif1heic"), utf8(xmpText("trainedAlgorithmicMedia")));
  const r = checkImage(heic);
  assert.equal(r.details.parsed, false);
  assert.equal(r.result, "likely");
  assert.ok(checkImage(bytes("\0\0\0\x18ftypheic")).reasons.some(x => x.key === "unknown_format"));
});

test("every reason has English words, and no result is ever 'real'", () => {
  const files = [jpeg(), png(), webp(), jpeg(jpegXmp("trainedAlgorithmicMedia")), jpeg(segment(0xeb, c2paBytes("digitalCapture")))];
  for (const file of files) {
    const r = checkImage(file, { fileName: "Screenshot 2026-11-17.png" });
    assert.notEqual(r.result, "real");
    for (const reason of r.reasons) assert.ok(REASON_TEXT[reason.key], `no words for ${reason.key}`);
    for (const line of r.text) assert.ok(!line.includes("undefined"), line);
  }
});

test("the made test images give the expected results (skipped if not made yet)", (t) => {
  const dir = path.join(__dirname, "..", "data", "fixtures");
  const listFile = path.join(dir, "expected.json");
  if (!fs.existsSync(listFile)) return t.skip("run tests/make_fixtures.py first");
  for (const item of JSON.parse(fs.readFileSync(listFile, "utf8"))) {
    const r = checkImage(fs.readFileSync(path.join(dir, item.file)), { fileName: item.file });
    assert.equal(r.band, item.band, `${item.file}: band`);
    assert.equal(r.result, item.result, `${item.file}: result`);
  }
});
