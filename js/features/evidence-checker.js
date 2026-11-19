"use strict";

// Feature: Evidence checker (screenshots, photos, letters and documents). No screen of its own.
// Owner: Yan Lin
// EVIDENCE_CHECKER is exposed as a global lexical binding so analyser.js can reach it.
//
// OCR and detector results are computed on this device. Static labels and outcomes are translated
// through the shared dictionary from js/data/evidence-checker.js.
//
// For pictures, two checks run at the same time on this device:
//   1. the words in the picture (Tesseract.js) go through the text detector (what it SAYS)
//   2. the AI label check (ImageDetector, "image detector prototype/detector/") looks inside the
//      file for labels AI tools leave, such as content credentials (how it was MADE)
// When the words look risky, they lead and the picture's labels are shown as extra findings
// (result.image). When the words look fine or can't be read, a found AI label leads instead
// (result.imageLed). Finding no label changes nothing: it does not mean the picture is real.
const EVIDENCE_CHECKER = (function () {
  const data = EVIDENCE_CHECKER_DATA;
  addTranslations(data.text);

  function normalizeKind(rawKind) {
    const k = String(rawKind || "").toLowerCase().trim();
    if (k === "screenshot" || k === "image" || k.startsWith("image/")) return "screenshot";
    if (k === "document" || k === "file" || k === "pdf" || k === "text") return "document";
    return k;
  }

  function handles(rawKind) {
    const k = normalizeKind(rawKind);
    return Boolean(data.kinds && data.kinds[k]);
  }

  function kind(rawKind) {
    const k = normalizeKind(rawKind);
    const meta = (data.kinds && data.kinds[k]) || data.kinds.document;
    return {
      label: meta.label,
      icon: meta.icon,
      steps: meta.steps.slice()
    };
  }

  // ---------- Browser-Only Text Extraction (No File Uploads) ----------

  function isPlainTextFile(file) {
    const type = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    return (
      type.startsWith("text/") ||
      type === "application/json" ||
      type === "message/rfc822" ||
      /\.(txt|csv|html|htm|eml|md|json|log)$/i.test(name)
    );
  }

  function isImageFile(file) {
    const type = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);
  }

  function isPdfFile(file) {
    const type = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    return type === "application/pdf" || /\.pdf$/i.test(name);
  }

  async function extractFromImage(file) {
    if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
      return { ok: false, errorKey: "ocrUnavailable" };
    }
    const res = await window.Tesseract.recognize(file, "eng");
    const text = (res && res.data && res.data.text ? res.data.text : "").trim();
    return text ? { ok: true, text } : { ok: false, errorKey: "emptyText" };
  }

  async function extractFromPdf(file) {
    if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== "function") {
      return { ok: false, errorKey: "ocrUnavailable" };
    }
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str).join(" "));
    }
    const text = pages.join("\n").trim();
    return text ? { ok: true, text } : { ok: false, errorKey: "emptyText" };
  }

  async function extractText(file, fileName) {
    // 1. Built-in sample lookup when no File object is passed
    if (!file && fileName) {
      const sample = (data.samples || []).find(s => s.name === fileName);
      if (sample && sample.sampleText) {
        return { ok: true, text: sample.sampleText };
      }
    }

    // 2. Ensure a real File/Blob was provided by analyser.js
    if (!(file instanceof Blob)) {
      return { ok: false, errorKey: "noFile" };
    }

    // 3. Native browser text reading (works with zero external dependencies)
    if (isPlainTextFile(file)) {
      const raw = await file.text();
      const cleaned = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return cleaned ? { ok: true, text: cleaned } : { ok: false, errorKey: "emptyText" };
    }

    // 4. Image OCR via global Tesseract.js (if loaded in index.html)
    if (isImageFile(file)) {
      return await extractFromImage(file);
    }

    // 5. PDF text extraction via global PDF.js (if loaded in index.html)
    if (isPdfFile(file)) {
      return await extractFromPdf(file);
    }

    return { ok: false, errorKey: "ocrUnavailable" };
  }

  // ---------- AI Labels Inside the Picture (ImageDetector) ----------

  // The AI label check's reason codes, as translation keys (codes with no key here are not shown)
  const IMAGE_REASON_KEYS = {
    c2pa_ai: "ev.img.c2paAi", c2pa_ai_edit: "ev.img.c2paAiEdit", c2pa_signed: "ev.img.c2paSigned",
    c2pa_unchecked: "ev.img.c2paUnchecked", c2pa_broken: "ev.img.c2paBroken",
    label_ai: "ev.img.labelAi", label_ai_edit: "ev.img.labelAiEdit", generator: "ev.img.generator",
    tool_name: "ev.img.toolName", unsigned_note: "ev.img.unsigned", not_proof: "ev.img.notProof"
  };

  // Runs the AI label check on a picture. Returns null when it found nothing, isn't loaded, or
  // fails, so a problem here never stops the text check.
  // Otherwise: { result: "likely" | "partial" | "uncertain", title, reasons } (translation keys).
  async function checkPictureLabels(file) {
    if (!(file instanceof Blob) || !isImageFile(file) || !window.ImageDetector) return null;
    try {
      const found = await window.ImageDetector.checkFile(file);
      if (!found || found.result === "unsure") return null;
      const reasons = [...new Set(found.reasons.map(r => IMAGE_REASON_KEYS[r.key]).filter(Boolean))];
      return { result: found.result, title: `ev.img.title.${found.result}`, reasons };
    } catch (e) {
      console.warn("The AI label check failed:", e);
      return null;
    }
  }

  // ---------- Check Extracted Text with Existing TextDetector ----------

  async function check(rawKind, fileName, file) {
    const resolvedName = (file && file.name) || fileName || "";
    // Both checks at the same time: the label check takes milliseconds, the text reading seconds
    const [extraction, image] = await Promise.all([extractText(file, resolvedName), checkPictureLabels(file)]);

    // The picture is labelled as AI, and its words look fine or can't be read: the label leads
    const imageLeads = (textReasons) => ({
      result: image.result,
      title: image.title,
      reasons: [...image.reasons, ...textReasons],
      steps: data.imageSteps.slice(),
      fileName: resolvedName,
      extractedText: extraction.ok ? extraction.text : "",
      detectorResult: null,
      image,
      imageLed: true
    });

    if (!extraction.ok) {
      if (image) return imageLeads([]);
      const fallback = data.outcomes[extraction.errorKey] || data.outcomes.ocrUnavailable;
      return {
        result: fallback.result,
        title: fallback.title,
        reasons: fallback.reasons.slice(),
        steps: fallback.steps.slice(),
        fileName: resolvedName,
        extractedText: "",
        detectorResult: null,
        image: null,
        imageLed: false
      };
    }

    const lang = typeof window.getLanguage === "function" ? window.getLanguage() : "en";
    const detectorResult = window.TextDetector.checkMessage(extraction.text, { lang });
    const risk = String((detectorResult && detectorResult.risk) || "low").toLowerCase();
    const outcome = data.outcomes[risk] || data.outcomes.low;

    if (image && risk === "low") return imageLeads(outcome.reasons);

    return {
      result: outcome.result,
      title: outcome.title,
      reasons: outcome.reasons.slice(),
      steps: outcome.steps.slice(),
      fileName: resolvedName,
      extractedText: extraction.text,
      detectorResult,
      image,             // the picture's AI labels, shown under the words' result (or null)
      imageLed: false
    };
  }

  return {
    handles,
    kind,
    check,
    samples: data.samples || []
  };
})();