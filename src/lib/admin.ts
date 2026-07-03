import "server-only";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase Admin SDK. Requires FIREBASE_SERVICE_ACCOUNT
 * (the service-account JSON, base64-encoded) in the environment.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function adminApp(): App {
  if (getApps().length) return getApps()[0];
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  return initializeApp({ credential: cert(json) });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

export function isAdminEmail(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Verify the Bearer token from a request. Returns the decoded token or null. */
export async function verifyRequest(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

/** Like verifyRequest, but also requires the caller to be an admin. */
export async function verifyAdminRequest(req: Request): Promise<DecodedIdToken | null> {
  const decoded = await verifyRequest(req);
  if (!decoded || !isAdminEmail(decoded.email)) return null;
  return decoded;
}

/** Delete every Firestore doc belonging to a user (passwords + vault doc). */
export async function purgeUserData(uid: string): Promise<number> {
  const db = adminDb();
  const passwords = await db.collection("users").doc(uid).collection("passwords").listDocuments();
  let deleted = 0;
  for (let i = 0; i < passwords.length; i += 450) {
    const batch = db.batch();
    for (const ref of passwords.slice(i, i + 450)) {
      batch.delete(ref);
      deleted++;
    }
    await batch.commit();
  }
  await db.collection("users").doc(uid).delete();
  return deleted;
}
