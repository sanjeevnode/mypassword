"use client";

/**
 * Gates children behind the master password: shows the setup form for new
 * users, the unlock form when locked, and children once unlocked.
 */
import { useState, ReactNode, FormEvent } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import { GlassInput, PrimaryButton, SectionLabel, PageLoader } from "./ui";
import { GlowCard } from "./aceternity/GlowCard";

export default function MasterGate({ children }: { children: ReactNode }) {
  const { status } = useVault();

  if (status === "loading") return <PageLoader label="Preparing vault…" />;
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
    <div className="flex min-h-[65vh] items-center justify-center">
      <GlowCard className="glow-border w-full max-w-md p-8">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
          <ShieldCheck size={20} />
        </div>
        <SectionLabel>One-time setup</SectionLabel>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
          Create your Master Password
        </h2>
        <p className="mt-2 mb-6 text-[13px] leading-relaxed text-zinc-400">
          This single password protects your entire vault and never leaves this device.{" "}
          <span className="text-zinc-300">If you forget it, your data cannot be recovered.</span>
        </p>
        <form onSubmit={submit} className="space-y-3">
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
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <PrimaryButton type="submit" disabled={busy} className="w-full py-3">
            {busy ? "Deriving keys…" : "Create Vault"}
          </PrimaryButton>
        </form>
      </GlowCard>
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
    <div className="flex min-h-[65vh] items-center justify-center">
      <GlowCard className="glow-border w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
          <Lock size={20} />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white">Vault is locked</h2>
        <p className="mt-1 mb-6 text-[13px] text-zinc-400">
          Enter your master password to decrypt your vault.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <GlassInput
            type="password"
            placeholder="Master password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <PrimaryButton type="submit" disabled={busy || !pw} className="w-full py-3">
            {busy ? "Unlocking…" : "Unlock"}
          </PrimaryButton>
        </form>
      </GlowCard>
    </div>
  );
}
