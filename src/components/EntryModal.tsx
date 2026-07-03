"use client";

import { useState, FormEvent } from "react";
import { Entry, EntrySecret } from "@/lib/vault";
import { GlassCard, GlassInput, GlassTextarea, PrimaryButton, GhostButton } from "./ui";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg bg-[#221040]/90 p-6">
        <h3 className="mb-4 text-lg font-bold text-white">
          {initial ? "Edit credential" : "Add credential"}
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <GlassInput placeholder="Site name (e.g. GitHub)" value={site} onChange={(e) => setSite(e.target.value)} autoFocus />
          <GlassInput placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <GlassInput placeholder="Username / email" value={username} onChange={(e) => setUsername(e.target.value)} />
          <div className="flex gap-2">
            <GlassInput
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <GhostButton type="button" onClick={() => setShowPw((s) => !s)}>
              {showPw ? "Hide" : "Show"}
            </GhostButton>
          </div>
          <GlassInput placeholder="Tags, comma separated (e.g. work, dev)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <GlassTextarea placeholder="Notes (encrypted)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Encrypting…" : "Save"}
            </PrimaryButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
