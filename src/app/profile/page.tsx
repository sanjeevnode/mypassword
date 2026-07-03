"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, KeyRound, Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { listEntries, rotateEntries, addEntry, EntrySecret } from "@/lib/vault";
import { csvTemplate, downloadFile, parseCsv, toCsv } from "@/lib/csv";
import MasterGate from "@/components/MasterGate";
import { GlassCard, GlassInput, PrimaryButton, GhostButton, SectionLabel, PageLoader } from "@/components/ui";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader label="Loading profile…" />;

  return (
    <MasterGate>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <SectionLabel>Settings</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Profile</h1>
        </div>

        <GlassCard className="flex items-center gap-4 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
            <UserRound size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.displayName ?? "Account"}</p>
            <p className="text-[13px] text-zinc-400">{user.email}</p>
          </div>
        </GlassCard>

        <ChangeMasterPassword uid={user.uid} />
        <ImportCsv uid={user.uid} />
        <ExportVault uid={user.uid} />
        <DangerZone />
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
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
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
          {busy && <Loader2 size={13} className="animate-spin" />}
          {busy ? "Re-encrypting vault…" : "Change & Re-encrypt"}
        </PrimaryButton>
      </form>
    </GlassCard>
  );
}

function ImportCsv({ uid }: { uid: string }) {
  const { dataKey } = useVault();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file || !dataKey) return;
    setBusy(true);
    setMsg(null);
    try {
      const { rows, errors } = parseCsv(await file.text());
      if (rows.length === 0) {
        setMsg({ ok: false, text: errors[0] ?? "No valid rows found in the file." });
        return;
      }
      let imported = 0;
      for (const row of rows) {
        const blob = await encryptJson(dataKey, {
          username: row.username,
          password: row.password,
          notes: row.notes,
        });
        await addEntry(uid, { site: row.site, url: row.url, tags: row.tags, blob });
        imported++;
      }
      setMsg({
        ok: true,
        text:
          `Imported ${imported} credential${imported === 1 ? "" : "s"}.` +
          (errors.length ? ` Skipped ${errors.length} row(s): ${errors[0]}` : ""),
      });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Import failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Upload size={16} className="text-violet-400" />
        <h2 className="text-base font-bold tracking-tight text-white">Bulk import (CSV)</h2>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
        Download the template, fill one credential per row (separate multiple tags with{" "}
        <code className="text-violet-300">;</code>), then upload it. Each row is encrypted in your
        browser before being stored.
      </p>
      <div className="flex flex-wrap gap-2">
        <GhostButton onClick={() => downloadFile("mypassword-template.csv", csvTemplate())}>
          <FileSpreadsheet size={13} /> Download template
        </GhostButton>
        <label
          className={`btn-ghost inline-flex items-center gap-2 rounded-none px-3.5 py-2 text-sm font-medium text-zinc-200 hover:text-white ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {busy ? "Encrypting & importing…" : "Upload filled CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
      )}
    </GlassCard>
  );
}

function ExportVault({ uid }: { uid: string }) {
  const { dataKey, requireConfirmation } = useVault();
  const [busy, setBusy] = useState(false);

  const exportCsv = async () => {
    if (!dataKey) return;
    if (!confirm("This downloads all your passwords as an UNENCRYPTED CSV. Store it somewhere safe. Continue?"))
      return;
    if (!(await requireConfirmation())) return;
    setBusy(true);
    try {
      const entries = await listEntries(uid);
      const rows = [];
      for (const entry of entries) {
        const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
        rows.push({
          site: entry.site,
          url: entry.url,
          username: secret.username,
          password: secret.password,
          tags: entry.tags ?? [],
          notes: secret.notes,
        });
      }
      downloadFile(`mypassword-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Download size={16} className="text-violet-400" />
        <h2 className="text-base font-bold tracking-tight text-white">Export vault (CSV)</h2>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
        Decrypts your vault locally and downloads a CSV backup — same format as the import
        template. The file is plaintext, so handle it with care.
      </p>
      <GhostButton onClick={exportCsv} disabled={busy}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {busy ? "Decrypting…" : "Export as CSV"}
      </GhostButton>
    </GlassCard>
  );
}

function DangerZone() {
  const { user, logOut } = useAuth();
  const { requireConfirmation } = useVault();
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const deleteAccount = async () => {
    if (!user || phrase !== "DELETE") return;
    // gate 1: master password re-confirmation
    if (!(await requireConfirmation())) return;
    // gate 2: final native confirm
    if (
      !confirm(
        "FINAL WARNING: this permanently deletes your account and every stored credential. There is no undo and no recovery. Continue?"
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      await logOut();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
      setBusy(false);
    }
  };

  return (
    <GlassCard className="border-rose-500/30! p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Trash2 size={16} className="text-rose-400" />
        <h2 className="text-base font-bold tracking-tight text-white">Delete account</h2>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
        Permanently deletes your account, your vault keys, and every stored credential.{" "}
        <span className="text-rose-300">This cannot be undone</span> — export a CSV backup first if
        you might need your passwords again.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <GlassInput
          placeholder='Type "DELETE" to confirm'
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="max-w-55"
        />
        <button
          onClick={deleteAccount}
          disabled={busy || phrase !== "DELETE"}
          className="inline-flex items-center gap-2 border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {busy ? "Deleting everything…" : "Delete my account"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </GlassCard>
  );
}
