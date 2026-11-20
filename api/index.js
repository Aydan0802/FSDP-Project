require("../server/db/load-env.js").loadEnv();
const { createApp } = require("../server/app.js");
const { createUserStore } = require("../server/db/user-store.js");
const { createRecords } = require("../server/records.js");

module.exports = createApp({ userStore: createUserStore(), records: createRecords() });
