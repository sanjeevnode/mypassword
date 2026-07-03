"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, KeyRound, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { listEntries, rotateEntries, EntrySecret } from "@/lib/vault";
import MasterGate from "@/components/MasterGate";
import { GlassCard, GlassInput, PrimaryButton, GhostButton, Spinner, SectionLabel } from "@/components/ui";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  return (
    <MasterGate>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <SectionLabel>Settings</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Profile</h1>
        </div>

        <GlassCard className="flex items-center gap-4 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-none border border-violet-500/25 bg-violet-500/10 text-violet-400">
            <UserRound size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.displayName ?? "Account"}</p>
            <p className="text-[13px] text-zinc-500">{user.email}</p>
          </div>
        </GlassCard>

        <ChangeMasterPassword uid={user.uid} />
        <ExportVault uid={user.uid} />
      </div>
    </MasterGate>
  );
}

function ChangeMasterPassword({ uid }: { uid: string }) {
  const { dataKey, changeMasterPassword } = useVault();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 10) return setMsg({ ok: false, text: "New password must be at least 10 characters." });
    if (next !== confirm) return setMsg({ ok: false, text: "New passwords don't match." });
    if (!dataKey) return setMsg({ ok: false, text: "Vault must be unlocked." });
    setBusy(true);
    try {
      const ok = await changeMasterPassword(current, next, async (newKey) => {
        // full rotation: decrypt every entry with the current key,
        // re-encrypt with the new data key, write back in batches
        const entries = await listEntries(uid);
        const updates = [];
        for (const entry of entries) {
          const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
          updates.push({ id: entry.id, blob: await encryptJson(newKey, secret) });
        }
        await rotateEntries(uid, updates);
      });
      setMsg(
        ok
          ? { ok: true, text: "Master password changed. All entries were re-encrypted with a fresh key." }
          : { ok: false, text: "Current master password is incorrect." }
      );
      if (ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Rotation failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <KeyRound size={16} className="text-violet-400" />
        <h2 className="text-base font-bold tracking-tight text-white">Change Master Password</h2>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-500">
        Rotates your encryption key: every credential is decrypted locally and re-encrypted with a
        brand-new key. Don&apos;t close this tab while it runs.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <GlassInput type="password" placeholder="Current master password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassInput type="password" placeholder="New master password" value={next} onChange={(e) => setNext(e.target.value)} />
          <GlassInput type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {msg && <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>}
        <PrimaryButton type="submit" disabled={busy || !current || !next}>
          {busy ? "Re-encrypting vault…" : "Change & Re-encrypt"}
        </PrimaryButton>
      </form>
    </GlassCard>
  );
}

function ExportVault({ uid }: { uid: string }) {
  const { dataKey, requireConfirmation } = useVault();
  const [busy, setBusy] = useState(false);

  const exportJson = async () => {
    if (!dataKey) return;
    if (!confirm("This downloads all your passwords as UNENCRYPTED JSON. Store it somewhere safe. Continue?"))
      return;
    if (!(await requireConfirmation())) return;
    setBusy(true);
    try {
      const entries = await listEntries(uid);
      const data = [];
      for (const entry of entries) {
        const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
        data.push({ site: entry.site, url: entry.url, tags: entry.tags, ...secret });
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mypassword-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Download size={16} className="text-violet-400" />
        <h2 className="text-base font-bold tracking-tight text-white">Export vault</h2>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-500">
        Decrypts your vault locally and downloads a JSON backup. The file is plaintext — handle with care.
      </p>
      <GhostButton onClick={exportJson} disabled={busy}>
        <Download size={13} />
        {busy ? "Decrypting…" : "Export as JSON"}
      </GhostButton>
    </GlassCard>
  );
}
