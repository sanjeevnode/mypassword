"use client";

/**
 * Holds the unlocked data key in memory only. Locking (or a page refresh)
 * discards it — nothing sensitive is ever persisted client-side.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  deriveVerifier,
  deriveMasterKey,
  generateDataKey,
  wrapDataKey,
  unwrapDataKey,
  randomBytes,
  toB64,
  fromB64,
  constantTimeEqual,
} from "@/lib/crypto";
import { getUserVault, createUserVault, updateUserVault, UserVaultDoc } from "@/lib/vault";

type VaultStatus = "loading" | "no-vault" | "locked" | "unlocked";

interface VaultCtx {
  status: VaultStatus;
  dataKey: CryptoKey | null;
  vaultDoc: UserVaultDoc | null;
  setupVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  changeMasterPassword: (
    current: string,
    next: string,
    reencryptAll: (newKey: CryptoKey) => Promise<void>
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<VaultCtx | null>(null);

const AUTO_LOCK_MS = 10 * 60 * 1000;

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [dataKey, setDataKey] = useState<CryptoKey | null>(null);
  const [vaultDoc, setVaultDoc] = useState<UserVaultDoc | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    setDataKey(null);
    setStatus((s) => (s === "unlocked" ? "locked" : s));
    if (lockTimer.current) clearTimeout(lockTimer.current);
  }, []);

  const armAutoLock = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(lock, AUTO_LOCK_MS);
  }, [lock]);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus("loading");
      setVaultDoc(null);
      setDataKey(null);
      return;
    }
    const docData = await getUserVault(user.uid);
    setVaultDoc(docData);
    setStatus(docData ? "locked" : "no-vault");
    setDataKey(null);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setupVault = useCallback(
    async (masterPassword: string) => {
      if (!user) throw new Error("Not signed in");
      const authSalt = randomBytes(16);
      const encSalt = randomBytes(16);
      const verifier = await deriveVerifier(masterPassword, authSalt);
      const masterKey = await deriveMasterKey(masterPassword, encSalt);
      const newDataKey = await generateDataKey();
      const wrappedKey = await wrapDataKey(masterKey, newDataKey);
      const docData: UserVaultDoc = {
        authSalt: toB64(authSalt),
        encSalt: toB64(encSalt),
        verifier,
        wrappedKey,
      };
      await createUserVault(user.uid, docData);
      setVaultDoc(docData);
      setDataKey(newDataKey);
      setStatus("unlocked");
      armAutoLock();
    },
    [user, armAutoLock]
  );

  const unlock = useCallback(
    async (masterPassword: string) => {
      if (!user || !vaultDoc) return false;
      const verifier = await deriveVerifier(masterPassword, fromB64(vaultDoc.authSalt));
      if (!constantTimeEqual(verifier, vaultDoc.verifier)) return false;
      try {
        const masterKey = await deriveMasterKey(masterPassword, fromB64(vaultDoc.encSalt));
        const key = await unwrapDataKey(masterKey, vaultDoc.wrappedKey);
        setDataKey(key);
        setStatus("unlocked");
        armAutoLock();
        return true;
      } catch {
        return false;
      }
    },
    [user, vaultDoc, armAutoLock]
  );

  const changeMasterPassword = useCallback(
    async (
      current: string,
      next: string,
      reencryptAll: (newKey: CryptoKey) => Promise<void>
    ) => {
      if (!user || !vaultDoc) return false;
      // verify current password and recover the data key
      const curVerifier = await deriveVerifier(current, fromB64(vaultDoc.authSalt));
      if (!constantTimeEqual(curVerifier, vaultDoc.verifier)) return false;
      let oldDataKey: CryptoKey;
      try {
        const curMasterKey = await deriveMasterKey(current, fromB64(vaultDoc.encSalt));
        oldDataKey = await unwrapDataKey(curMasterKey, vaultDoc.wrappedKey);
      } catch {
        return false;
      }
      void oldDataKey;

      // full rotation: new salts, new data key, re-encrypt every entry
      const authSalt = randomBytes(16);
      const encSalt = randomBytes(16);
      const verifier = await deriveVerifier(next, authSalt);
      const masterKey = await deriveMasterKey(next, encSalt);
      const newDataKey = await generateDataKey();
      const wrappedKey = await wrapDataKey(masterKey, newDataKey);

      await reencryptAll(newDataKey);

      const docData: Partial<UserVaultDoc> = {
        authSalt: toB64(authSalt),
        encSalt: toB64(encSalt),
        verifier,
        wrappedKey,
      };
      await updateUserVault(user.uid, docData);
      setVaultDoc((v) => (v ? { ...v, ...docData } : v));
      setDataKey(newDataKey);
      setStatus("unlocked");
      armAutoLock();
      return true;
    },
    [user, vaultDoc, armAutoLock]
  );

  return (
    <Ctx.Provider
      value={{ status, dataKey, vaultDoc, setupVault, unlock, lock, changeMasterPassword, refresh }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useVault() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
