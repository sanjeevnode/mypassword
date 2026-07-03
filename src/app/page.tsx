"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Copy,
  Eye,
  FolderKey,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  TimerReset,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Spinner, Tag, SectionLabel } from "@/components/ui";
import { Spotlight } from "@/components/aceternity/Spotlight";
import { GlowCard } from "@/components/aceternity/GlowCard";
import Logo from "@/components/Logo";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/vault");
  }, [loading, user, router]);

  if (loading) return <Spinner />;

  return (
    <div className="relative">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-40" />

      {/* hero — left aligned, aceternity style */}
      <section className="relative mx-auto grid max-w-5xl items-center gap-10 pb-16 pt-20 md:grid-cols-[1.2fr_0.8fr] md:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-none border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-3 text-xs font-medium text-zinc-300">
            <span className="rounded-none bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              Security
            </span>
            Zero-knowledge encryption
            <ArrowRight size={12} className="text-zinc-400" />
          </div>

          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
            Own your passwords
            <br />
            <span className="text-violet-400">end to end.</span>
          </h1>

          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-zinc-300">
            Every credential is sealed with AES-256 in your browser before it touches a server. Not
            us, not Google, not anyone can read your vault — only your master password can open it.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={signIn}
              className="btn-solid inline-flex items-center gap-2.5 rounded-none px-7 py-3 text-sm font-semibold text-white"
            >
              <GoogleIcon /> Continue with Google
            </button>
            <a
              href="https://github.com/sanjeevnode/mypassword"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center gap-2 rounded-none px-6 py-3 text-sm font-medium text-zinc-200"
            >
              <GithubIcon /> View source
            </a>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="space-y-4 text-sm text-zinc-300">
            <p className="leading-relaxed">
              Built on the same model trusted by leading password managers — envelope encryption
              with Argon2id key derivation.
            </p>
            <div className="flex items-center gap-1 text-violet-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <ul className="space-y-2 text-[13px] text-zinc-400">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-violet-400" /> Argon2id · 64 MiB memory-hard KDF
              </li>
              <li className="flex items-center gap-2">
                <Lock size={14} className="text-violet-400" /> AES-256-GCM envelope encryption
              </li>
              <li className="flex items-center gap-2">
                <Eye size={14} className="text-violet-400" /> Re-verifies you before every reveal
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* product preview frame — aceternity style browser mock */}
      <section className="mx-auto max-w-5xl pb-20">
        <div className="panel overflow-hidden rounded-none">
          {/* chrome bar */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-black/50 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="ml-2 flex items-center gap-2 rounded-none border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400">
              <Lock size={10} className="text-violet-400" />
              mypassword.sanjeevnode.in/vault
            </div>
          </div>

          {/* mock vault */}
          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
                  Vault
                </p>
                <p className="text-lg font-bold text-white">6 credentials</p>
              </div>
              <span className="btn-solid rounded-none px-4 py-2 text-xs font-semibold text-white">
                + New credential
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_ENTRIES.map((m) => (
                <div key={m.site} className="panel rounded-none p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none border border-white/10 bg-white/[0.04] text-[13px] font-bold text-violet-300">
                      {m.site[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{m.site}</p>
                      <p className="text-[10px] text-zinc-500">{m.url}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {m.tags.map((t) => (
                      <Tag key={t}>#{t}</Tag>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-none border border-white/[0.06] bg-black/40 px-3 py-2">
                    <span className="font-mono text-xs tracking-widest text-zinc-500">
                      ••••••••••••
                    </span>
                    <span className="flex gap-2 text-zinc-500">
                      <Eye size={12} />
                      <Copy size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* bento features */}
      <section className="mx-auto max-w-5xl pb-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>Features</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Everything a vault should do.
            <span className="text-zinc-400"> Nothing it shouldn&apos;t see.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* encryption pipeline — wide card */}
          <GlowCard className="p-6 sm:col-span-2">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
              <Lock size={17} />
            </div>
            <h3 className="text-base font-semibold text-white">Client-side encryption pipeline</h3>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-400">
              Your master password never leaves the browser. It derives keys locally; only
              ciphertext ever crosses the network.
            </p>
            <PipelineDiagram />
          </GlowCard>

          <GlowCard className="p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
              <TimerReset size={17} />
            </div>
            <h3 className="text-base font-semibold text-white">Locks itself</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Auto-locks after 5 idle minutes, 60 seconds in a hidden tab, and wipes keys from
              memory instantly.
            </p>
            <LockMeter />
          </GlowCard>

          <GlowCard className="p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
              <RefreshCw size={17} />
            </div>
            <h3 className="text-base font-semibold text-white">Key rotation</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Change your master password and every credential is re-encrypted with a brand-new key
              — locally.
            </p>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
              <Search size={17} />
            </div>
            <h3 className="text-base font-semibold text-white">Search & tags</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              Organize credentials with tags and find anything instantly — without decrypting a
              single secret.
            </p>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-none bg-violet-500/15 text-violet-300">
              <FolderKey size={17} />
            </div>
            <h3 className="text-base font-semibold text-white">Your data, portable</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              One-click export decrypts your vault locally into JSON. No lock-in, no gatekeeping,
              ever.
            </p>
          </GlowCard>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-5xl pb-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Three steps to a sealed vault.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            n="01"
            title="Sign in with Google"
            desc="Your Google account identifies you — it never sees or holds your secrets."
          />
          <Step
            n="02"
            title="Set a master password"
            desc="Argon2id turns it into encryption keys on your device. We store only a verifier — never the password."
          />
          <Step
            n="03"
            title="Store everything"
            desc="Each credential is sealed with AES-256-GCM before upload. Reveal requires re-confirming it's you."
          />
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-5xl pb-16">
        <div className="panel glow-border relative overflow-hidden rounded-none p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-6 w-fit drop-shadow-[0_0_24px_rgba(139,92,246,0.5)]">
              <Logo size={56} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Seal your passwords in black.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-300">
              Free, open source, zero-knowledge. Your first credential is 30 seconds away.
            </p>
            <button
              onClick={signIn}
              className="btn-solid mx-auto mt-8 inline-flex items-center gap-2.5 rounded-none px-8 py-3.5 text-sm font-semibold text-white"
            >
              <GoogleIcon /> Get started — it&apos;s free
            </button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span>
            My<span className="text-violet-400/80">Password</span> — zero-knowledge vault
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/sanjeevnode/mypassword"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition hover:text-zinc-300"
          >
            <GithubIcon /> Source
          </a>
          <span className="flex items-center gap-1.5">
            <KeyRound size={12} className="text-violet-500/70" /> AES-256 · Argon2id
          </span>
        </div>
      </footer>
    </div>
  );
}

/** master password → argon2id → key → AES → ciphertext flow */
function PipelineDiagram() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-medium">
      <PipeNode label="Master password" sub="never sent" />
      <PipeArrow />
      <PipeNode label="Argon2id" sub="64 MiB KDF" accent />
      <PipeArrow />
      <PipeNode label="AES-256-GCM" sub="in-browser" accent />
      <PipeArrow />
      <PipeNode label="Ciphertext" sub="only this is stored" />
    </div>
  );
}

function PipeNode({ label, sub, accent }: { label: string; sub: string; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? "rounded-none border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-violet-200"
          : "rounded-none border border-white/10 bg-white/[0.03] px-3 py-2 text-zinc-300"
      }
    >
      {label}
      <div className="text-[10px] font-normal text-zinc-400">{sub}</div>
    </div>
  );
}

function PipeArrow() {
  return <ArrowRight size={13} className="shrink-0 text-violet-500/60" />;
}

/** decorative countdown bar for the auto-lock card */
function LockMeter() {
  return (
    <div className="mt-6 space-y-2">
      {[
        { label: "idle", w: "w-2/3" },
        { label: "tab hidden", w: "w-1/4" },
      ].map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="w-16 text-[10px] text-zinc-500">{r.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div className={`h-full ${r.w} rounded-full bg-gradient-to-r from-violet-600 to-violet-400`} />
          </div>
          <Lock size={11} className="text-violet-500/70" />
        </div>
      ))}
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="panel panel-hover rounded-none p-6">
      <span className="bg-gradient-to-b from-violet-300 to-violet-600 bg-clip-text text-4xl font-bold text-transparent">
        {n}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}

const MOCK_ENTRIES = [
  { site: "GitHub", url: "github.com", tags: ["dev"] },
  { site: "Gmail", url: "mail.google.com", tags: ["personal"] },
  { site: "AWS Console", url: "aws.amazon.com", tags: ["work", "cloud"] },
  { site: "Netflix", url: "netflix.com", tags: ["media"] },
  { site: "Stripe", url: "stripe.com", tags: ["work"] },
  { site: "Discord", url: "discord.com", tags: ["social"] },
];

function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.97.75 12 .75 7.61.75 3.82 3.27 1.96 6.96l3.64 2.82C6.48 7.02 9.01 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.28H12v4.51h6.45c-.28 1.48-1.12 2.73-2.39 3.58l3.68 2.85c2.15-1.99 3.75-4.93 3.75-8.66z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.22a7.06 7.06 0 0 1 0-4.44L1.96 6.96a11.25 11.25 0 0 0 0 10.08l3.64-2.82z"
      />
      <path
        fill="#34A853"
        d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.68-2.85c-1.02.69-2.33 1.1-3.78 1.1-2.99 0-5.52-1.98-6.4-4.74l-3.64 2.82c1.86 3.69 5.65 6.39 10.04 6.39z"
      />
    </svg>
  );
}
