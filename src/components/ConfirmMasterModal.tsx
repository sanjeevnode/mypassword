"use client";

import { useState, FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { GlassInput, PrimaryButton, GhostButton } from "./ui";

export default function ConfirmMasterModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (password: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await onConfirm(pw);
    if (!ok) {
      setError("Incorrect master password.");
      setPw("");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel glow-border w-full max-w-sm rounded-none p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-none border border-violet-500/25 bg-violet-500/10 text-violet-400">
          <ShieldCheck size={19} />
        </div>
        <h3 className="text-base font-bold tracking-tight text-white">Confirm it&apos;s you</h3>
        <p className="mt-1 mb-4 text-[13px] text-zinc-500">
          Enter your master password to view sensitive data.
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
          <div className="flex justify-center gap-2">
            <GhostButton type="button" onClick={onCancel}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy || !pw}>
              {busy ? "Verifying…" : "Confirm"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
