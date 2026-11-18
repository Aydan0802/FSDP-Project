"use strict";

// Image metadata reader: finds the labels that AI image tools leave inside an image file.
// Owner: Aydan.
//
//   readMetadata(bytes) -> {
//     format      "jpeg" | "png" | "webp" | "gif" | "heic" | "avif" | "unknown"
//     parsed      true if we could walk the file's blocks (JPEG, PNG, WebP); false = we only
//                 searched the whole file for labels
//     blocks      [{ kind, size }]: the "details" blocks the file has (see the kinds below)
//     c2pa        null, or { sourceTypes, tools }: content credentials were found
//     labels      [{ where, sourceType }]: IPTC "digital source type" labels outside the credentials
//     generator   null, or { tool, where }: image-generator settings saved in the file
//     toolNames   [{ name, where }]: names of AI image tools found in the file's details
//   }
//
// How it works. An image file is a list of blocks: the picture itself, plus optional "details"
// blocks that apps add. We walk the blocks (JPEG segments, PNG chunks, WebP chunks), keep the
// details blocks, and look inside them for four kinds of AI label, strongest first:
//   1. C2PA content credentials: a signed record of how the image was made. Here we only read
//      what it says; c2pa.js checks the signature properly in the browser.
//   2. The IPTC "digital source type" label, a standard web address that ends in
//      "trainedAlgorithmicMedia" when an image was made by AI. Google and Meta add it.
//   3. Image-generator settings that Stable Diffusion tools save inside the file.
//   4. The name of an AI image tool written in the file's details (weakest: anyone can type it).
// Finding nothing proves nothing: messaging apps and screenshots remove all of these.
//
// Works in the browser (load this file first; it adds window.IMAGE_METADATA) and in Node
// (require("./metadata.js")). It never changes the file and never sends it anywhere.

(function () {
  const inNode = typeof module === "object" && module.exports;

  // The kinds of details block we keep (everything else is the picture, colour profiles etc.)
  //   exif     camera details (make, model, software, comments)
  //   xmp      a block of XML text that photo and AI apps use for labels
  //   iptc     older photo-agency details (credit, caption)
  //   text     a PNG text note: { keyword, value } (value is null when compressed)
  //   comment  a JPEG comment
  //   c2pa     content credentials
  //   whole    the whole file (for formats we can't walk, such as HEIC)

  // ---------- Small helpers ----------

  // Bytes to a string with one character per byte, so text labels can be searched for.
  // (Done in pieces because a very long argument list can crash String.fromCharCode.)
  function toText(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return out;
  }

  // A normal string written the way it appears inside a file (UTF-8 bytes, one char per byte),
  // so names like "DALL·E" are found too.
  function asFileText(str) {
    return toText(new TextEncoder().encode(str));
  }

  // The same string in UTF-16 (two bytes per letter), which EXIF comments often use
  function asUtf16(str, littleEndian) {
    return str.split("").map(ch => (littleEndian ? ch + "\0" : "\0" + ch)).join("");
  }

  function startsWith(bytes, offset, text) {
    for (let i = 0; i < text.length; i++) {
      if (bytes[offset + i] !== text.charCodeAt(i)) return false;
    }
    return true;
  }

  const u16be = (b, i) => (b[i] << 8) | b[i + 1];
  const u32be = (b, i) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const u32le = (b, i) => b[i] + (b[i + 1] << 8) + (b[i + 2] << 16) + ((b[i + 3] << 24) >>> 0);

  // ---------- 1. What kind of file is it? (from its first bytes, not its name) ----------

  function detectFormat(b) {
    if (b[0] === 0xff && b[1] === 0xd8) return "jpeg";
    if (startsWith(b, 0, "\x89PNG\r\n\x1a\n")) return "png";
    if (startsWith(b, 0, "RIFF") && startsWith(b, 8, "WEBP")) return "webp";
    if (startsWith(b, 0, "GIF8")) return "gif";
    if (startsWith(b, 4, "ftyp")) {
      const brand = toText(b.subarray(8, 12));
      if (brand.startsWith("avi")) return "avif";
      if (/^(heic|heix|mif1|msf1|hevc)/.test(brand)) return "heic";
    }
    return "unknown";
  }

  // ---------- 2. Walk the file's blocks and keep the details blocks ----------

  // JPEG: a list of segments, each "FF xx" + a 2-byte length, until the picture data starts
  function jpegBlocks(b) {
    const blocks = [];
    let pos = 2;
    while (pos + 4 <= b.length && b[pos] === 0xff) {
      const marker = b[pos + 1];
      if (marker === 0xff) { pos += 1; continue; }            // padding byte
      if (marker === 0xd9 || marker === 0xda) break;           // end of file / picture data starts
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { pos += 2; continue; } // no length
      const length = u16be(b, pos + 2);
      const data = b.subarray(pos + 4, pos + 2 + length);
      if (marker === 0xe1 && startsWith(data, 0, "Exif\0\0")) blocks.push({ kind: "exif", data });
      else if (marker === 0xe1 && startsWith(data, 0, "http://ns.adobe.com/x")) blocks.push({ kind: "xmp", data });
      else if (marker === 0xeb && startsWith(data, 0, "JP")) blocks.push({ kind: "c2pa", data });  // APP11 = JUMBF
      else if (marker === 0xed && startsWith(data, 0, "Photoshop 3.0")) blocks.push({ kind: "iptc", data });
      else if (marker === 0xfe) blocks.push({ kind: "comment", data });
      pos += 2 + length;
    }
    // Large credentials are split over several APP11 segments: join them into one block
    const c2paParts = blocks.filter(x => x.kind === "c2pa");
    const others = blocks.filter(x => x.kind !== "c2pa");
    if (c2paParts.length) {
      const joined = new Uint8Array(c2paParts.reduce((n, x) => n + x.data.length, 0));
      let at = 0;
      for (const part of c2paParts) { joined.set(part.data, at); at += part.data.length; }
      // APP11 can also hold other JUMBF data; it is only content credentials if it says "c2pa"
      if (toText(joined).includes("c2pa")) others.push({ kind: "c2pa", data: joined });
    }
    return others;
  }

  // PNG: a list of chunks, each a 4-byte length, a 4-letter type, the data and a checksum
  function pngBlocks(b) {
    const blocks = [];
    let pos = 8;
    while (pos + 8 <= b.length) {
      const length = u32be(b, pos);
      const type = toText(b.subarray(pos + 4, pos + 8));
      const data = b.subarray(pos + 8, pos + 8 + length);
      if (type === "tEXt" || type === "zTXt" || type === "iTXt") {
        const note = pngTextNote(type, data);
        // Photo apps put their XMP block in an iTXt note with this keyword
        blocks.push(note.keyword === "XML:com.adobe.xmp" ? { kind: "xmp", data } : { kind: "text", data, note });
      } else if (type === "eXIf") blocks.push({ kind: "exif", data });
      else if (type === "caBX") blocks.push({ kind: "c2pa", data });
      if (type === "IEND") break;
      pos += 12 + length;
    }
    return blocks;
  }

  // A PNG text note is "keyword", a zero byte, then the text. zTXt notes, and iTXt notes with
  // the compressed flag set, keep the text squeezed (compressed), so we only read their keyword.
  function pngTextNote(type, data) {
    const end = data.indexOf(0);
    const keyword = toText(data.subarray(0, end < 0 ? data.length : end));
    if (end < 0 || type === "zTXt") return { keyword, value: null };
    if (type === "tEXt") return { keyword, value: toText(data.subarray(end + 1)) };
    // iTXt: keyword, 0, compressed flag, method, language, 0, translated keyword, 0, UTF-8 text
    if (data[end + 1] === 1) return { keyword, value: null };
    let at = data.indexOf(0, end + 3);          // end of the language tag
    at = data.indexOf(0, at + 1);               // end of the translated keyword
    return { keyword, value: at < 0 ? null : new TextDecoder().decode(data.subarray(at + 1)) };
  }

  // WebP: "RIFF", size, "WEBP", then chunks: a 4-letter name, a 4-byte length, the data
  function webpBlocks(b) {
    const blocks = [];
    let pos = 12;
    while (pos + 8 <= b.length) {
      const type = toText(b.subarray(pos, pos + 4));
      const length = u32le(b, pos + 4);
      const data = b.subarray(pos + 8, pos + 8 + length);
      if (type === "EXIF") blocks.push({ kind: "exif", data });
      else if (type === "XMP ") blocks.push({ kind: "xmp", data });
      else if (type === "C2PA") blocks.push({ kind: "c2pa", data });
      pos += 8 + length + (length % 2);        // chunks are padded to an even length
    }
    return blocks;
  }

  // ---------- 3. Look for AI labels inside the blocks ----------

  // IPTC "digital source type" values (https://cv.iptc.org/newscodes/digitalsourcetype/).
  // The letters before each name must not be letters, so "trainedAlgorithmicMedia" does not
  // also match inside "compositeWithTrainedAlgorithmicMedia".
  const SOURCE_TYPES = [
    { name: "trainedAlgorithmicMedia", type: "ai" },                    // made by generative AI
    { name: "compositeWithTrainedAlgorithmicMedia", type: "ai_edit" },  // a picture changed with AI
    { name: "digitalCapture", type: "camera" },                         // taken with a camera
    { name: "computationalCapture", type: "camera" },                   // phone camera with processing
    { name: "screenCapture", type: "screenshot" },
  ];

  function findSourceTypes(text) {
    const found = SOURCE_TYPES
      .filter(s => new RegExp(`(?<![A-Za-z])${s.name}(?![A-Za-z])`).test(text))
      .map(s => s.type);
    return [...new Set(found)];
  }

  // Keywords that image generators use for their settings in PNG text notes
  const GENERATOR_KEYWORDS = {
    parameters: "a Stable Diffusion web UI (AUTOMATIC1111, Forge)",
    prompt: "ComfyUI",
    workflow: "ComfyUI",
    invokeai_metadata: "InvokeAI",
    "sd-metadata": "InvokeAI",
    Dream: "InvokeAI",
  };

  // The same web UIs write these words into a JPEG's EXIF comment instead
  const SETTINGS_WORDS = ["Negative prompt:", "CFG scale:", "Sampler:"];

  // Names of AI image tools. Matched as whole words, with capitals as written. Weak evidence:
  // anyone can type a name, and the list is what tools are reported to write (not all checked).
  const AI_TOOL_NAMES = [
    "Midjourney", "DALL-E", "DALL·E", "ChatGPT", "OpenAI", "Stable Diffusion", "ComfyUI",
    "NovelAI", "Adobe Firefly", "Imagen", "Gemini", "Made with Google AI", "Meta AI",
    "Leonardo.Ai", "Ideogram", "Bing Image Creator", "Microsoft Designer", "Grok",
  ];

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function findToolNames(text) {
    return AI_TOOL_NAMES.filter(name =>
      new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(asFileText(name))}(?![A-Za-z0-9])`).test(text));
  }

  function hasSettingsWords(text) {
    const found = word => [asFileText(word), asUtf16(word, true), asUtf16(word, false)].some(w => text.includes(w));
    return SETTINGS_WORDS.filter(found).length >= 2;    // two of the three, to avoid chance matches
  }

  // ---------- 4. Put it together ----------

  function readMetadata(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const format = detectFormat(bytes);
    const walk = { jpeg: jpegBlocks, png: pngBlocks, webp: webpBlocks }[format];
    const parsed = Boolean(walk);
    // Formats we can't walk (HEIC, AVIF, GIF, unknown): search the whole file instead
    const blocks = parsed ? walk(bytes) : [{ kind: "whole", data: bytes }];

    const result = { format, parsed, blocks: [], c2pa: null, labels: [], generator: null, toolNames: [] };
    const addTool = (name, where) => {
      if (!result.toolNames.some(t => t.name === name)) result.toolNames.push({ name, where });
    };

    for (const block of blocks) {
      if (block.kind !== "whole") result.blocks.push({ kind: block.kind, size: block.data.length });
      const text = toText(block.data);

      // Content credentials: kept apart, because c2pa.js can check their signature
      const wholeHasC2pa = block.kind === "whole" && text.includes("jumb") && text.includes("c2pa");
      if (block.kind === "c2pa" || wholeHasC2pa) {
        result.c2pa = { sourceTypes: findSourceTypes(text), tools: findToolNames(text) };
        continue;
      }
      for (const sourceType of findSourceTypes(text)) result.labels.push({ where: block.kind, sourceType });
      if (block.kind === "text" && GENERATOR_KEYWORDS[block.note.keyword] && !result.generator) {
        result.generator = { tool: GENERATOR_KEYWORDS[block.note.keyword], where: `PNG text note "${block.note.keyword}"` };
      }
      if (["exif", "comment", "whole"].includes(block.kind) && !result.generator && hasSettingsWords(text)) {
        result.generator = { tool: "a Stable Diffusion web UI (AUTOMATIC1111, Forge)", where: block.kind === "exif" ? "EXIF comment" : block.kind };
      }
      for (const name of findToolNames(text)) addTool(name, block.kind);
    }
    return result;
  }

  const api = { readMetadata, detectFormat, findSourceTypes, findToolNames, SOURCE_TYPES, AI_TOOL_NAMES };
  if (inNode) module.exports = api;
  else globalThis.IMAGE_METADATA = api;
})();
