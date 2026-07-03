/**
 * Zero-knowledge crypto core.
 *
 * Envelope encryption model:
 *  - A random 256-bit "data key" encrypts every vault entry (AES-256-GCM).
 *  - The master password derives (Argon2id) two things, with independent salts:
 *      1. a verifier hash, stored server-side to check login attempts
 *      2. a master key, which wraps (encrypts) the data key
 *  - The master password, master key and data key never leave the browser.
 */
import { argon2id } from "hash-wasm";

export interface WrappedKey {
  ct: string; // base64 ciphertext of the data key
  iv: string; // base64 GCM nonce
}

export interface CipherBlob {
  ct: string;
  iv: string;
}

const ARGON2 = {
  iterations: 3,
  memorySize: 65536, // 64 MiB
  parallelism: 1,
  hashLength: 32,
};

// ---------- encoding helpers ----------

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// ---------- key derivation ----------

async function argon2Derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  return argon2id({
    password,
    salt,
    ...ARGON2,
    outputType: "binary",
  });
}

/** Derive the login verifier (safe to store server-side). */
export async function deriveVerifier(password: string, authSalt: Uint8Array): Promise<string> {
  return toB64(await argon2Derive(password, authSalt));
}

/** Derive the master (key-wrapping) key. Never persisted anywhere. */
export async function deriveMasterKey(password: string, encSalt: Uint8Array): Promise<CryptoKey> {
  const bits = await argon2Derive(password, encSalt);
  return crypto.subtle.importKey("raw", bits as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// ---------- AES-GCM primitives ----------

async function aesEncrypt(key: CryptoKey, plaintext: Uint8Array): Promise<CipherBlob> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource
  );
  return { ct: toB64(ct), iv: toB64(iv) };
}

async function aesDecrypt(key: CryptoKey, blob: CipherBlob): Promise<Uint8Array> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(blob.iv) as BufferSource },
    key,
    fromB64(blob.ct) as BufferSource
  );
  return new Uint8Array(pt);
}

// ---------- data key lifecycle ----------

export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function wrapDataKey(masterKey: CryptoKey, dataKey: CryptoKey): Promise<WrappedKey> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", dataKey));
  return aesEncrypt(masterKey, raw);
}

/** Throws if the master key is wrong (GCM auth failure). */
export async function unwrapDataKey(masterKey: CryptoKey, wrapped: WrappedKey): Promise<CryptoKey> {
  const raw = await aesDecrypt(masterKey, wrapped);
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// ---------- entry payload encryption ----------

export async function encryptJson(dataKey: CryptoKey, obj: unknown): Promise<CipherBlob> {
  return aesEncrypt(dataKey, new TextEncoder().encode(JSON.stringify(obj)));
}

export async function decryptJson<T>(dataKey: CryptoKey, blob: CipherBlob): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await aesDecrypt(dataKey, blob))) as T;
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
