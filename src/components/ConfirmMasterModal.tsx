"use client";

import { useState, FormEvent } from "react";
import { GlassCard, GlassInput, PrimaryButton, GhostButton } from "./ui";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-sm bg-[#221040]/90 p-6 text-center">
        <div className="mb-2 text-4xl">🛡️</div>
        <h3 className="mb-1 text-lg font-bold text-white">Confirm it&apos;s you</h3>
        <p className="mb-4 text-sm text-purple-200/70">
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
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="flex justify-center gap-2">
            <GhostButton type="button" onClick={onCancel}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy || !pw}>
              {busy ? "Verifying…" : "Confirm"}
            </PrimaryButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
