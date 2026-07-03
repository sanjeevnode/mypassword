"use client";

/**
 * Gates children behind the master password: shows the setup form for new
 * users, the unlock form when locked, and children once unlocked.
 */
import { useState, ReactNode, FormEvent } from "react";
import { useVault } from "@/context/VaultContext";
import { GlassCard, GlassInput, PrimaryButton, Spinner } from "./ui";

export default function MasterGate({ children }: { children: ReactNode }) {
  const { status } = useVault();

  if (status === "loading") return <Spinner />;
  if (status === "no-vault") return <SetupForm />;
  if (status === "locked") return <UnlockForm />;
  return <>{children}</>;
}

function SetupForm() {
  const { setupVault } = useVault();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 10) return setError("Use at least 10 characters.");
    if (pw !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await setupVault(pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="w-full max-w-md p-8">
        <h2 className="mb-2 text-xl font-bold text-white">Create your Master Password</h2>
        <p className="mb-6 text-sm text-purple-200/70">
          This single password protects your entire vault. It is never sent to any server —{" "}
          <strong className="text-purple-100">if you forget it, your data cannot be recovered.</strong>
        </p>
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            type="password"
            placeholder="Master password (min 10 characters)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
          />
          <GlassInput
            type="password"
            placeholder="Confirm master password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <PrimaryButton type="submit" disabled={busy} className="w-full py-3">
            {busy ? "Setting up vault…" : "Create Vault"}
          </PrimaryButton>
        </form>
      </GlassCard>
    </div>
  );
}

function UnlockForm() {
  const { unlock } = useVault();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const ok = await unlock(pw);
    setBusy(false);
    if (!ok) setError("Incorrect master password.");
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <div className="mb-3 text-5xl">🔒</div>
        <h2 className="mb-6 text-xl font-bold text-white">Vault is locked</h2>
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            type="password"
            placeholder="Master password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <PrimaryButton type="submit" disabled={busy || !pw} className="w-full py-3">
            {busy ? "Unlocking…" : "Unlock"}
          </PrimaryButton>
        </form>
      </GlassCard>
    </div>
  );
}
