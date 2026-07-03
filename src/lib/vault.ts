/**
 * Firestore data layer. Only ciphertext and non-sensitive metadata are stored.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import type { CipherBlob, WrappedKey } from "./crypto";

export interface UserVaultDoc {
  authSalt: string; // base64
  encSalt: string; // base64
  verifier: string; // base64 argon2id output
  wrappedKey: WrappedKey;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Decrypted entry payload (never stored in plaintext). */
export interface EntrySecret {
  username: string;
  password: string;
  notes: string;
}

/** Firestore shape of a vault entry. */
export interface EntryDoc {
  site: string; // display name, kept plaintext for search
  url: string;
  tags: string[];
  blob: CipherBlob; // encrypted EntrySecret
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Entry extends EntryDoc {
  id: string;
}

const userRef = (uid: string) => doc(fbDb(), "users", uid);
const entriesRef = (uid: string) => collection(fbDb(), "users", uid, "passwords");

export async function getUserVault(uid: string): Promise<UserVaultDoc | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserVaultDoc) : null;
}

export async function createUserVault(uid: string, data: UserVaultDoc): Promise<void> {
  await setDoc(userRef(uid), { ...data, createdAt: serverTimestamp() });
}

export async function updateUserVault(uid: string, data: Partial<UserVaultDoc>): Promise<void> {
  await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() });
}

export async function listEntries(uid: string): Promise<Entry[]> {
  const snap = await getDocs(entriesRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as EntryDoc) }));
}

export async function addEntry(uid: string, entry: EntryDoc): Promise<string> {
  const ref = await addDoc(entriesRef(uid), { ...entry, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateEntry(uid: string, id: string, entry: Partial<EntryDoc>): Promise<void> {
  await updateDoc(doc(fbDb(), "users", uid, "passwords", id), {
    ...entry,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntry(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(fbDb(), "users", uid, "passwords", id));
}

/** Batch-write re-encrypted blobs during master password rotation. */
export async function rotateEntries(
  uid: string,
  updates: { id: string; blob: CipherBlob }[]
): Promise<void> {
  // Firestore batches cap at 500 writes
  for (let i = 0; i < updates.length; i += 450) {
    const batch = writeBatch(fbDb());
    for (const u of updates.slice(i, i + 450)) {
      batch.update(doc(fbDb(), "users", uid, "passwords", u.id), {
        blob: u.blob,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
