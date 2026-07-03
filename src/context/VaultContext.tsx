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
import ConfirmMasterModal from "@/components/ConfirmMasterModal";

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
  /**
   * Gate for sensitive actions (reveal/copy/export). Resolves true if the
   * user confirmed the master password within the grace window, or confirms
   * it now via a modal; false if they cancel.
   */
  requireConfirmation: () => Promise<boolean>;
}

const Ctx = createContext<VaultCtx | null>(null);

const AUTO_LOCK_MS = 5 * 60 * 1000;
const HIDDEN_LOCK_MS = 60 * 1000;
const CONFIRM_GRACE_MS = 90 * 1000;

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [dataKey, setDataKey] = useState<CryptoKey | null>(null);
  const [vaultDoc, setVaultDoc] = useState<UserVaultDoc | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastConfirm = useRef(0);
  const [confirmResolver, setConfirmResolver] = useState<((ok: boolean) => void) | null>(null);

  const lock = useCallback(() => {
    setDataKey(null);
    setStatus((s) => (s === "unlocked" ? "locked" : s));
    lastConfirm.current = 0;
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

  // Lock when the tab stays hidden for more than a minute.
  useEffect(() => {
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(lock, HIDDEN_LOCK_MS);
      } else if (hiddenTimer) {
        clearTimeout(hiddenTimer);
        hiddenTimer = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (hiddenTimer) clearTimeout(hiddenTimer);
    };
  }, [lock]);

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
      lastConfirm.current = Date.now();
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
        lastConfirm.current = Date.now();
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

  const requireConfirmation = useCallback(async () => {
    if (status !== "unlocked" || !vaultDoc) return false;
    if (Date.now() - lastConfirm.current < CONFIRM_GRACE_MS) {
      armAutoLock();
      return true;
    }
    return new Promise<boolean>((resolve) => {
      setConfirmResolver(() => (ok: boolean) => {
        setConfirmResolver(null);
        if (ok) {
          lastConfirm.current = Date.now();
          armAutoLock();
        }
        resolve(ok);
      });
    });
  }, [status, vaultDoc, armAutoLock]);

  const verifyMasterPassword = useCallback(
    async (password: string) => {
      if (!vaultDoc) return false;
      const verifier = await deriveVerifier(password, fromB64(vaultDoc.authSalt));
      return constantTimeEqual(verifier, vaultDoc.verifier);
    },
    [vaultDoc]
  );

  return (
    <Ctx.Provider
      value={{
        status,
        dataKey,
        vaultDoc,
        setupVault,
        unlock,
        lock,
        changeMasterPassword,
        refresh,
        requireConfirmation,
      }}
    >
      {children}
      {confirmResolver && (
        <ConfirmMasterModal
          onConfirm={async (pw) => {
            const ok = await verifyMasterPassword(pw);
            if (ok) confirmResolver(true);
            return ok;
          }}
          onCancel={() => confirmResolver(false)}
        />
      )}
    </Ctx.Provider>
  );
}

export function useVault() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
