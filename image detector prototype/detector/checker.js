"use strict";

// The image checker: is this picture labelled as made or changed by AI?  Owner: Aydan.
//
//   checkImage(bytes, { fileName, c2pa }) -> result      (works in Node and the browser)
//   await checkFile(file)                 -> result      (browser: also checks the content
//                                                         credentials' signature with c2pa.js)
//   result = {
//     verdict         one plain English headline
//     result          the website's result key: "likely" | "partial" | "uncertain" | "unsure"
//                     (never "real": finding no label is not evidence that a picture is real)
//     band            "HIGH" | "MEDIUM" | "INCONCLUSIVE"   (as in the voice detector)
//     likelihood_pct  always null: a label is a yes/no finding, not a calibrated chance
//     confidence      "high" | "medium" | "low": how sure we are
//     reasons         [{ key, ...details }]: short codes, so the website can word them in English,
//                     Chinese or Malay. REASON_TEXT below has the English.
//     text            the reasons in English
//     details         what readMetadata() found, for the "details" part of the screen
//   }
//
// How it decides, like the voice detector's watermark layer: the first rule that matches wins.
//   1. Content credentials (C2PA) say the picture was made with AI          -> HIGH   "likely"
//      ... or that part of it was changed with AI                           -> MEDIUM "partial"
//      ... or they don't match the picture any more (changed after signing) -> MEDIUM "uncertain"
//   2. An IPTC "made by AI" label                                           -> HIGH or MEDIUM
//   3. Image-generator settings saved in the file                           -> HIGH   "likely"
//   4. The name of an AI image tool in the file's details                   -> HIGH, low confidence
//   5. Nothing found                                                        -> INCONCLUSIVE "unsure"
// Confidence starts at "high" and drops one level for each weakness: a label that isn't signed
// (anyone can add or remove it), a signature we could not check, or credentials that are broken.
// A label shows how a picture was made, never whether a message is a scam.

(function () {
  const inNode = typeof module === "object" && module.exports;
  const { readMetadata } = inNode ? require("./metadata.js") : globalThis.IMAGE_METADATA;

  // Confidence: start at "high", drop one level per weakness
  const LEVELS = ["low", "medium", "high"];
  const dropLevels = (n) => LEVELS[Math.max(0, LEVELS.length - 1 - n)];

  // Where in the file a label was found, in words
  const WHERE = { xmp: "XMP details", exif: "EXIF details", iptc: "IPTC details", text: "PNG text notes",
                  comment: "JPEG comment", whole: "file", c2pa: "content credentials" };

  // English wording for each reason code (the website can translate the codes itself)
  const REASON_TEXT = {
    c2pa_ai: r => `The picture's content credentials say it was made with AI${r.tool ? ` (${r.tool})` : ""}.`,
    c2pa_ai_edit: r => `The picture's content credentials say part of it was made or changed with AI${r.tool ? ` (${r.tool})` : ""}.`,
    c2pa_signed: r => r.trusted
      ? `The credentials are signed by ${r.signer || "a known signer"}, and the picture has not been changed since.`
      : `The credentials are signed${r.signer ? ` by a certificate that names "${r.signer}"` : ""}, and the picture has not been changed since. That signer is not on the official C2PA list, so the name is not confirmed.`,
    c2pa_broken: () => "The content credentials don't match the picture: it was changed after they were added.",
    c2pa_unchecked: () => "The credentials' signature could not be checked here, so they count like an ordinary label.",
    c2pa_no_ai: r => `The picture has content credentials${r.tool ? ` from ${r.tool}` : ""}, and they don't say AI was used.`,
    c2pa_camera: () => "The credentials say a camera took this photo. That shows where the photo came from, not that what it shows is true.",
    label_ai: r => `The file is labelled "made by AI" (the IPTC digital source type, in its ${WHERE[r.where] || r.where}).`,
    label_ai_edit: r => `The file is labelled "changed with AI" (the IPTC digital source type, in its ${WHERE[r.where] || r.where}).`,
    generator: r => `The file holds image-generator settings saved by ${r.tool} (in its ${r.where}).`,
    tool_name: r => `The file's details mention ${r.name}, an AI image tool.`,
    unsigned_note: () => "Labels like this are not signed: anyone can add or remove them, so they only count when they are there.",
    none_found: () => "No AI label was found. That does not mean the picture is real: most pictures lose their labels when they are shared.",
    stripped: () => "The file has no details left at all, which usually means an app removed them.",
    via_whatsapp: () => "The file name looks like it came through WhatsApp, which removes these labels when a photo is sent the normal way.",
    via_telegram: () => "The file name looks like it was saved from Telegram, which often removes these labels.",
    screenshot: () => "Screenshots never carry these labels, whatever they show.",
    synthid: () => "Pictures from Google's AI tools also carry a hidden SynthID mark that this check can't read. The Gemini app can check it, but that sends the picture to Google.",
    unknown_format: () => "This kind of file can't be read properly yet (JPEG, PNG and WebP can), so only a quick search was done.",
    not_proof: () => "A label shows how the picture was made, not whether the message is a scam.",
  };

  function reasonText(reason) {
    return REASON_TEXT[reason.key] ? REASON_TEXT[reason.key](reason) : reason.key;
  }

  // Clues that a file passed through an app that removes labels (from its name only)
  function nameClues(fileName) {
    const name = String(fileName || "");
    const clues = [];
    if (/-WA\d{4}/i.test(name)) clues.push({ key: "via_whatsapp" });                       // IMG-20261117-WA0003.jpg
    if (/^photo_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/i.test(name)) clues.push({ key: "via_telegram" }); // photo_2026-11-17_10-22-33.jpg
    if (/screenshot|screen shot/i.test(name)) clues.push({ key: "screenshot" });
    return clues;
  }

  function build(verdict, band, result, confidence, reasons, meta) {
    return {
      verdict, result, band, likelihood_pct: null, confidence, reasons,
      text: reasons.map(reasonText), details: meta,
    };
  }

  // c2pa: what c2pa.js found when it checked the credentials in the browser (optional):
  //   null (no credentials), { error } (couldn't check), or { state, sourceTypes, tool, signer, trusted }
  function checkImage(bytes, options = {}) {
    const meta = readMetadata(bytes);
    const checked = options.c2pa && !options.c2pa.error ? options.c2pa : null;
    let c2paNote = [];

    // ---- 1. Content credentials ----
    if (meta.c2pa || checked) {
      const sourceTypes = checked ? checked.sourceTypes : meta.c2pa.sourceTypes;
      const tool = checked ? checked.tool : (meta.c2pa.tools[0] || "");
      const broken = Boolean(checked && checked.state === "Invalid");
      // Each weakness drops the confidence one level
      const weaknesses = (checked ? 0 : 1) + (broken ? 1 : 0);
      const how = !checked ? [{ key: "c2pa_unchecked" }]
        : broken ? [{ key: "c2pa_broken" }]
        : [{ key: "c2pa_signed", signer: checked.signer, trusted: checked.trusted }];

      if (sourceTypes.includes("ai")) {
        return build("Made with AI (its content credentials say so)", "HIGH", "likely", dropLevels(weaknesses),
          [{ key: "c2pa_ai", tool }, ...how, { key: "not_proof" }], meta);
      }
      if (sourceTypes.includes("ai_edit")) {
        return build("Part of it was made or changed with AI (its content credentials say so)", "MEDIUM", "partial",
          dropLevels(weaknesses), [{ key: "c2pa_ai_edit", tool }, ...how, { key: "not_proof" }], meta);
      }
      if (broken) {
        return build("Its content credentials don't match the picture", "MEDIUM", "uncertain", "low",
          [{ key: "c2pa_broken" }, { key: "none_found" }], meta);
      }
      // Credentials that don't mention AI: carry on with the other checks, but say what they said
      c2paNote = [{ key: "c2pa_no_ai", tool }];
      if (sourceTypes.includes("camera")) c2paNote.push({ key: "c2pa_camera" });
    }

    // ---- 2. The IPTC "made by AI" label (not signed, so confidence drops one level) ----
    const aiLabel = meta.labels.find(l => l.sourceType === "ai");
    const editLabel = meta.labels.find(l => l.sourceType === "ai_edit");
    if (aiLabel) {
      return build("Made with AI (the file is labelled so)", "HIGH", "likely", dropLevels(1),
        [{ key: "label_ai", where: aiLabel.where }, { key: "unsigned_note" }, { key: "not_proof" }], meta);
    }
    if (editLabel) {
      return build("Part of it was made or changed with AI (the file is labelled so)", "MEDIUM", "partial", dropLevels(1),
        [{ key: "label_ai_edit", where: editLabel.where }, { key: "unsigned_note" }, { key: "not_proof" }], meta);
    }

    // ---- 3. Image-generator settings ----
    if (meta.generator) {
      return build("Made with AI (it holds image-generator settings)", "HIGH", "likely", dropLevels(1),
        [{ key: "generator", tool: meta.generator.tool, where: meta.generator.where }, { key: "unsigned_note" }, { key: "not_proof" }], meta);
    }

    // ---- 4. An AI tool's name (weakest: two weaknesses, anyone can type a name anywhere) ----
    if (meta.toolNames.length) {
      return build("Probably made with AI (an AI tool is named in its details)", "HIGH", "likely", dropLevels(2),
        [...meta.toolNames.map(t => ({ key: "tool_name", name: t.name })), { key: "unsigned_note" }, { key: "not_proof" }], meta);
    }

    // ---- 5. Nothing found: unknown, never "real" ----
    const reasons = [...c2paNote, { key: "none_found" }];
    if (!meta.parsed) reasons.push({ key: "unknown_format" });
    else if (!meta.blocks.length) reasons.push({ key: "stripped" });
    reasons.push(...nameClues(options.fileName), { key: "synthid" });
    return build("No AI label found (this does not mean it is real)", "INCONCLUSIVE", "unsure", "low", reasons, meta);
  }

  // Browser only: read the file on this device, check its content credentials with c2pa.js
  // (only when the file has some), then decide
  async function checkFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let c2pa = null;
    if (readMetadata(bytes).c2pa && globalThis.ImageC2pa) c2pa = await globalThis.ImageC2pa.read(file);
    return checkImage(bytes, { fileName: file.name, c2pa });
  }

  const api = { checkImage, checkFile, reasonText, REASON_TEXT };
  if (inNode) module.exports = api;
  else globalThis.ImageDetector = api;
})();
