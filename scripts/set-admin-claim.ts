import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.env.ADMIN_UID?.trim();

if (!uid) {
  throw new Error("ADMIN_UID is required. Use the Firebase Authentication UID, not an email address.");
}

initializeApp({ credential: applicationDefault() });

const auth = getAuth();

const user = await auth.getUser(uid);
const existingClaims = user.customClaims ?? {};

await auth.setCustomUserClaims(uid, {
  ...existingClaims,
  admin: true,
});

console.log(`Admin custom claim assigned to Firebase UID: ${uid}`);
console.log("The user must sign out and sign in again to refresh the ID token.");
