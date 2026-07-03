# 🔐 MyPassword — Zero-Knowledge Password Vault

A password manager built with Next.js, Firebase, and Vercel. All cryptography runs **in the browser** — the master password, encryption keys, and plaintext secrets never leave your device.

## Security model (envelope encryption)

- A random 256-bit **data key** encrypts every vault entry with **AES-256-GCM**.
- Your **master password** derives two values via **Argon2id** (64 MiB, 3 iterations), each with an independent random salt:
  - a **verifier hash** — stored in Firestore, used only to check login attempts
  - a **master key** — never persisted; it "wraps" (encrypts) the data key
- Firestore only ever stores: the verifier, salts, the wrapped data key, and AES-GCM ciphertext.
- Changing the master password performs a **full rotation**: a new data key is generated and every entry is decrypted and re-encrypted locally.
- The vault auto-locks after 10 minutes of inactivity (key is discarded from memory).

⚠️ Zero-knowledge means **a forgotten master password is unrecoverable** — there is no reset.

## Setup

### 1. Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Analytics optional).
2. **Authentication → Sign-in method → Google → Enable** (set a support email).
3. **Firestore Database → Create database** (production mode, pick a region).
4. **Firestore → Rules** → paste the contents of [`firestore.rules`](firestore.rules) → Publish.
5. **Project settings → Your apps → Web (`</>`)** → register an app → copy the config values.

### 2. Local environment

```bash
cp .env.local.example .env.local   # then fill in the Firebase config values
npm install
npm run dev
```

Open http://localhost:3000.

### 3. Deploy to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Add the same `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings.
3. Deploy, then add your Vercel domain to **Firebase → Authentication → Settings → Authorized domains**.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 — purple glassmorphism UI
- Firebase Auth (Google) + Firestore (client SDK, rules-enforced per-user access)
- [`hash-wasm`](https://github.com/Daninet/hash-wasm) for Argon2id, WebCrypto for AES-256-GCM
