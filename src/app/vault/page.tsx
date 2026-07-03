"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import { GlowCard } from "@/components/aceternity/GlowCard";
import { GlassCard, GlassInput, PrimaryButton, Tag, Spinner, SectionLabel } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  const { dataKey, requireConfirmation } = useVault();
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
    if (!(await requireConfirmation())) return;
    const secret = await decryptJson<EntrySecret>(dataKey, entry.blob);
    setRevealed((r) => ({ ...r, [entry.id]: secret }));
  };

  const copyPassword = async (entry: Entry) => {
    if (!dataKey) return;
    if (!(await requireConfirmation())) return;
    const secret = revealed[entry.id] ?? (await decryptJson<EntrySecret>(dataKey, entry.blob));
    await navigator.clipboard.writeText(secret.password);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const edit = async (entry: Entry) => {
    if (!dataKey) return;
    if (!(await requireConfirmation())) return;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Vault</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {entries.length} credential{entries.length === 1 ? "" : "s"}
          </h1>
        </div>
        <PrimaryButton onClick={() => setModal({})}>
          <Plus size={15} /> New credential
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <GlassInput
            placeholder="Search site or URL…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <TagPill active={!activeTag} onClick={() => setActiveTag(null)}>
              All
            </TagPill>
            {allTags.map((t) => (
              <TagPill key={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)}>
                #{t}
              </TagPill>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-none border border-violet-500/25 bg-violet-500/10 text-violet-400">
            <KeyRound size={20} />
          </div>
          <p className="text-sm text-zinc-400">
            {entries.length === 0
              ? "Your vault is empty. Add your first credential."
              : "No entries match your search."}
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => {
            const secret = revealed[entry.id];
            return (
              <GlowCard key={entry.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-white/15 bg-white/8 text-sm font-bold text-violet-200">
                      {entry.site.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white">{entry.site}</h3>
                      {entry.url && (
                        <a
                          href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 truncate text-[11px] text-zinc-400 hover:text-violet-300"
                        >
                          <Globe size={10} className="shrink-0" />
                          <span className="truncate">{entry.url}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <IconBtn title="Edit" onClick={() => edit(entry)}>
                      <Pencil size={13} />
                    </IconBtn>
                    <IconBtn title="Delete" danger onClick={() => remove(entry)}>
                      <Trash2 size={13} />
                    </IconBtn>
                  </div>
                </div>

                {entry.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {entry.tags.map((t) => (
                      <Tag key={t}>#{t}</Tag>
                    ))}
                  </div>
                )}

                {secret && (
                  <div className="mt-3 space-y-1 rounded-none border border-white/12 bg-black/50 p-3 text-[13px]">
                    <p className="truncate text-zinc-300">
                      <span className="text-zinc-500">user </span>
                      {secret.username || "—"}
                    </p>
                    <p className="break-all font-mono text-violet-200">{secret.password}</p>
                    {secret.notes && <p className="pt-1 text-xs text-zinc-500">{secret.notes}</p>}
                  </div>
                )}

                <div className="mt-auto flex gap-1.5 pt-4">
                  <ActionBtn onClick={() => reveal(entry)}>
                    {secret ? <EyeOff size={13} /> : <Eye size={13} />}
                    {secret ? "Hide" : "Reveal"}
                  </ActionBtn>
                  <ActionBtn onClick={() => copyPassword(entry)}>
                    {copied === entry.id ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copied === entry.id ? "Copied" : "Copy"}
                  </ActionBtn>
                </div>
              </GlowCard>
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

function TagPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-none px-3 py-1 text-xs font-medium transition",
        active
          ? "border border-violet-500/40 bg-violet-500/20 text-violet-200"
          : "border border-white/15 bg-white/6 text-zinc-300 hover:border-violet-500/40 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function IconBtn({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-none p-1.5 text-zinc-400 transition hover:bg-white/[0.06]",
        danger ? "hover:text-rose-400" : "hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
    >
      {children}
    </button>
  );
}
