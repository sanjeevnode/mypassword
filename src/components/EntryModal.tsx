"use client";

import { useState, FormEvent } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Entry, EntrySecret } from "@/lib/vault";
import { GlassInput, GlassTextarea, PrimaryButton, GhostButton, SectionLabel } from "./ui";

export interface EntryFormValue {
  site: string;
  url: string;
  tags: string[];
  secret: EntrySecret;
}

export default function EntryModal({
  initial,
  initialSecret,
  onSave,
  onClose,
}: {
  initial?: Entry;
  initialSecret?: EntrySecret;
  onSave: (v: EntryFormValue) => Promise<void>;
  onClose: () => void;
}) {
  const [site, setSite] = useState(initial?.site ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [username, setUsername] = useState(initialSecret?.username ?? "");
  const [password, setPassword] = useState(initialSecret?.password ?? "");
  const [notes, setNotes] = useState(initialSecret?.notes ?? "");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!site.trim()) return setError("Site name is required.");
    setBusy(true);
    setError("");
    try {
      await onSave({
        site: site.trim(),
        url: url.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        secret: { username, password, notes },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel glow-border w-full max-w-lg rounded-none p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <SectionLabel>{initial ? "Edit" : "New"}</SectionLabel>
            <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white">
              {initial ? "Edit credential" : "Add credential"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-none p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <GlassInput placeholder="Site name (e.g. GitHub)" value={site} onChange={(e) => setSite(e.target.value)} autoFocus />
            <GlassInput placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <GlassInput placeholder="Username / email" value={username} onChange={(e) => setUsername(e.target.value)} />
          <div className="relative">
            <GlassInput
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <GlassInput placeholder="Tags, comma separated (e.g. work, dev)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <GlassTextarea placeholder="Notes (encrypted)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Encrypting…" : "Save"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
