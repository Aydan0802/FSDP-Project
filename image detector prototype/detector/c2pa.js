"use strict";

// Content credentials (C2PA) checker, browser only.  Owner: Aydan.
//
//   await ImageC2pa.read(file) -> null                      no credentials in the file
//                              -> { error }                 the check could not run (e.g. offline)
//                              -> { state, sourceTypes, tool, signer, trusted }
//     state        "Valid"   the signature checks out and the picture is unchanged since signing
//                  "Trusted" the same, and the signer is on the trust list we were given
//                  "Invalid" the credentials don't match the picture (changed after signing)
//     sourceTypes  what the credentials say about how it was made: "ai", "ai_edit", "camera" ...
//     tool         the app that wrote the credentials (as the credentials say)
//     signer       the organisation named in the signing certificate
//
// It uses Adobe's open-source C2PA library (@contentauth/c2pa-web, MIT licence), loaded from the
// jsDelivr CDN the first time a picture with credentials is checked (about 9 MB, then cached).
// The picture itself is read on this device: only the library is downloaded, nothing is sent.
// Without a trust list, a valid signature proves the picture is unchanged since signing, but not
// who signed it (anyone can make a certificate with any name), so "trusted" stays false.

(function () {
  const VERSION = "0.17.1";   // pinned: a new version can change how the library is used
  const LIBRARY = `https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@${VERSION}/+esm`;
  const WASM = `https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@${VERSION}/dist/resources/c2pa_bg.wasm`;

  let loading = null;   // the library is loaded once, then reused

  function load() {
    if (!loading) {
      loading = (async () => {
        const lib = await import(LIBRARY);
        const c2pa = await lib.createC2pa({ wasmSrc: WASM });
        return { lib, c2pa };
      })();
      loading.catch(() => { loading = null; });   // let a later check try again
    }
    return loading;
  }

  // What the credentials say, in the shape checker.js expects
  function summarise(store) {
    const active = (store.manifests || {})[store.active_manifest] || {};
    const info = (active.claim_generator_info || [])[0] || {};
    const signature = active.signature_info || {};
    // Search every manifest (the picture's own and the ones it was made from) for source types,
    // the same way metadata.js searches the file's bytes
    const sourceTypes = globalThis.IMAGE_METADATA.findSourceTypes(JSON.stringify(store.manifests || {}));
    const state = store.validation_state ||
      ((store.validation_status || []).some(s => !/untrusted/.test(s.code)) ? "Invalid" : "Valid");
    return {
      state,
      sourceTypes,
      tool: info.name || active.claim_generator || "",
      signer: signature.issuer || signature.common_name || "",
      trusted: state === "Trusted",
      codes: (store.validation_status || []).map(s => s.code),   // for the details view
    };
  }

  async function read(file) {
    try {
      const { lib, c2pa } = await load();
      const reader = await lib.Reader.fromBlob(c2pa, file.type || undefined, file);
      if (!reader) return null;
      try {
        return summarise(await reader.manifestStore());
      } finally {
        await reader.free();
      }
    } catch (err) {
      return { error: String((err && err.message) || err) };
    }
  }

  globalThis.ImageC2pa = { read, summarise, VERSION };
})();
