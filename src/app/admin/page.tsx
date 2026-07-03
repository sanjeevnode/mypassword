"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, RefreshCw, ShieldCheck, ShieldOff, Users, Vault } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Spinner, SectionLabel, GhostButton } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string | null;
  lastSignIn: string | null;
  disabled: boolean;
  hasVault: boolean;
  credentials: number;
  rotations: number;
}

interface Stats {
  totals: { users: number; disabled: number; withVault: number; credentials: number; rotations: number };
  users: AdminUser[];
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const isAdmin = !!ADMIN_EMAIL && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats.");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/");
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (loading || !user || !isAdmin) return <Spinner />;

  const toggle = async (u: AdminUser) => {
    const verb = u.disabled ? "reactivate" : "deactivate";
    if (!confirm(`${verb === "deactivate" ? "Deactivate" : "Reactivate"} ${u.email}? ${verb === "deactivate" ? "They will be signed out and unable to log in. Their data stays intact." : ""}`))
      return;
    setBusyUid(u.uid);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/user", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid: u.uid, disabled: !u.disabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Admin</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        </div>
        <GhostButton onClick={load}>
          <RefreshCw size={13} /> Refresh
        </GhostButton>
      </div>

      {error && (
        <GlassCard className="border-rose-500/40! p-4 text-sm text-rose-300">
          {error}
          {error.includes("FIREBASE_SERVICE_ACCOUNT") && (
            <span className="block pt-1 text-rose-200/70">
              Add the service-account key to .env.local / Vercel to enable the admin API.
            </span>
          )}
        </GlassCard>
      )}

      {!stats && !error ? (
        <Spinner />
      ) : stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={<Users size={16} />} label="Total users" value={stats.totals.users} />
            <StatCard icon={<Vault size={16} />} label="Vaults created" value={stats.totals.withVault} />
            <StatCard icon={<KeyRound size={16} />} label="Credentials stored" value={stats.totals.credentials} />
            <StatCard icon={<RefreshCw size={16} />} label="Password rotations" value={stats.totals.rotations} />
            <StatCard icon={<ShieldOff size={16} />} label="Deactivated" value={stats.totals.disabled} />
          </div>

          <GlassCard className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.1em] text-zinc-400">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-3 py-3 font-semibold">Last sign-in</th>
                  <th className="px-3 py-3 text-right font-semibold">Credentials</th>
                  <th className="px-3 py-3 text-right font-semibold">Rotations</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {stats.users.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{u.displayName || "—"}</p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{fmtDate(u.createdAt)}</td>
                    <td className="px-3 py-3 text-zinc-300">{fmtDate(u.lastSignIn)}</td>
                    <td className="px-3 py-3 text-right text-zinc-200">{u.hasVault ? u.credentials : "—"}</td>
                    <td className="px-3 py-3 text-right text-zinc-200">{u.hasVault ? u.rotations : "—"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium",
                          u.disabled
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-emerald-500/15 text-emerald-300"
                        )}
                      >
                        {u.disabled ? <ShieldOff size={11} /> : <ShieldCheck size={11} />}
                        {u.disabled ? "Deactivated" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? (
                        <span className="text-[11px] text-zinc-500">admin</span>
                      ) : (
                        <button
                          onClick={() => toggle(u)}
                          disabled={busyUid === u.uid}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium transition",
                            u.disabled
                              ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              : "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                          )}
                        >
                          {busyUid === u.uid ? "…" : u.disabled ? "Reactivate" : "Deactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <p className="text-xs text-zinc-500">
            Deactivation is a soft lock: the user can&apos;t sign in but their encrypted data stays
            intact. Credential counts and rotations are metadata only — vault contents are
            end-to-end encrypted and unreadable by anyone, including admins.
          </p>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 text-violet-300">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </GlassCard>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
