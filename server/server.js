"use strict";

// Pause & Prove: starts the server.
// Owner: Jose
// Run it from this folder:  npm install   (once)   then   npm start
// Then open http://localhost:3000

require("./db/load-env.js").loadEnv();   // reads server/.env if it exists (Supabase settings)
const { createApp } = require("./app.js");
const { createUserStore } = require("./db/user-store.js");

const PORT = process.env.PORT || 3000;

createApp({ userStore: createUserStore() }).listen(PORT, () => {
  console.log(`Verify the Caller is running at http://localhost:${PORT}`);
});