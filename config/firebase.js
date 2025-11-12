// // config/firebase.js
// import admin from "firebase-admin";
// import { createRequire } from "module";
// import { readFileSync } from "fs";
// import path from "path";

// const require = createRequire(import.meta.url);

// // Import the private key JSON

// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });



// export default admin;


import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// ✅ Only disable certificate verification in local development
if (process.env.NODE_ENV !== "production") {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  console.warn("⚠️ SSL certificate check disabled for local development");
}

const serviceAccountPath = path.resolve("config/serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized");
}

export default admin;
