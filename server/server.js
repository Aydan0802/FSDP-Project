"use strict";

// Verify the Caller: starts the server.
// Owner: Jose
// Run it from this folder:  npm install   (once)   then   npm start
// Then open http://localhost:3000

const { createApp } = require("./app.js");

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`Verify the Caller is running at http://localhost:${PORT}`);
});
