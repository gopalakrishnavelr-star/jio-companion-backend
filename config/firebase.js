// config/firebase.js
import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Import the private key JSON
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
