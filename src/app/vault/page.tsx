"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { encryptJson, decryptJson } from "@/lib/crypto";
import {
  Entry,
  EntrySecret,
  listEntries,
  addEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/vault";
import MasterGate from "@/components/MasterGate";
import EntryModal, { EntryFormValue } from "@/components/EntryModal";
import { GlassCard, GlassInput, PrimaryButton, GhostButton, Tag, Spinner } from "@/components/ui";

export default function VaultPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  return (
    <MasterGate>
      <Dashboard uid={user.uid} />
    </MasterGate>
  );
}

function Dashboard({ uid }: { uid: string }) {
  const { dataKey } = useVault();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { entry?: Entry; secret?: EntrySecret }>(null);
  const [revealed, setRevealed] = useState<Record<string, EntrySecret>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setEntries(await listEntries(uid));
  }, [uid]);

  useEffect(() => {
    reload();
  }, [reload]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    entries?.forEach((e) => e.tags?.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => !activeTag || e.tags?.includes(activeTag))
      .filter((e) => !q || e.site.toLowerCase().includes(q) || e.url.toLowerCase().includes(q))
      .sort((a, b) => a.site.localeCompare(b.site));
  }, [entries, query, activeTag]);

  const save = async (v: EntryFormValue) => {
    if (!dataKey) throw new Error("Vault is locked.");
    const blob = await encryptJson(dataKey, v.secret);
    if (modal?.entry) {
      await updateEntry(uid, modal.entry.id, { site: v.site, url: v.url, tags: v.tags, blob });
      setRevealed((r) => {
        const copy = { ...r };
        delete copy[modal.entry!.id];
        return copy;
      });
    } else {
      await addEntry(uid, { site: v.site, url: v.url, tags: v.tags, blob });
    }
    await reload();
  };

  const reveal = async (entry: Entry) => {
    if (!dataKey) return;
    if (revealed[entry.id]) {
      setRevealed((r) => {
        const copy = { ...r };
        delete copy[entry.id];
        return copy;
      });
      return;
    }
    const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
    setRevealed((r) => ({ ...r, [entry.id]: secret }));
  };

  const copyPassword = async (entry: Entry) => {
    if (!dataKey) return;
    const secret = revealed[entry.id] ?? (await decryptJson<EntrySecret>(dataKey, entry.blob));
    await navigator.clipboard.writeText(secret.password);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const edit = async (entry: Entry) => {
    if (!dataKey) return;
    const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
    setModal({ entry, secret });
  };

  const remove = async (entry: Entry) => {
    if (!confirm(`Delete "${entry.site}"? This cannot be undone.`)) return;
    await deleteEntry(uid, entry.id);
    await reload();
  };

  if (!entries) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <GlassInput
          placeholder="Search by site or URL…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex-1" />
        <PrimaryButton onClick={() => setModal({})}>+ Add credential</PrimaryButton>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-xs transition ${!activeTag ? "bg-purple-500/40 text-white" : "bg-white/5 text-purple-300 hover:bg-white/10"}`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`rounded-full px-3 py-1 text-xs transition ${activeTag === t ? "bg-purple-500/40 text-white" : "bg-white/5 text-purple-300 hover:bg-white/10"}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-purple-200/70">
          {entries.length === 0
            ? "Your vault is empty. Add your first credential!"
            : "No entries match your search."}
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((entry) => {
            const secret = revealed[entry.id];
            return (
              <GlassCard key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{entry.site}</h3>
                    {entry.url && (
                      <a
                        href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs text-purple-300 hover:underline"
                      >
                        {entry.url}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <GhostButton onClick={() => edit(entry)} title="Edit" className="px-2.5 py-1.5">
                      ✏️
                    </GhostButton>
                    <GhostButton onClick={() => remove(entry)} title="Delete" className="px-2.5 py-1.5">
                      🗑️
                    </GhostButton>
                  </div>
                </div>

                {entry.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.tags.map((t) => (
                      <Tag key={t}>#{t}</Tag>
                    ))}
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm">
                  {secret && (
                    <>
                      <p className="text-purple-200">
                        <span className="text-purple-400/70">user:</span> {secret.username || "—"}
                      </p>
                      <p className="break-all font-mono text-purple-100">{secret.password}</p>
                      {secret.notes && <p className="text-xs text-purple-300/70">{secret.notes}</p>}
                    </>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <GhostButton onClick={() => reveal(entry)} className="text-xs">
                    {secret ? "Hide" : "Reveal"}
                  </GhostButton>
                  <GhostButton onClick={() => copyPassword(entry)} className="text-xs">
                    {copied === entry.id ? "Copied ✓" : "Copy password"}
                  </GhostButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {modal && (
        <EntryModal
          initial={modal.entry}
          initialSecret={modal.secret}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
