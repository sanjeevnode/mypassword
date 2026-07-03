"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound, ShieldCheck, Cpu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
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
    <div className="relative overflow-hidden">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

      <section className="relative mx-auto flex min-h-[72vh] max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-8 drop-shadow-[0_0_30px_rgba(139,92,246,0.45)]">
          <Logo size={72} />
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.07] px-4 py-1.5 text-xs font-medium text-violet-300">
          <ShieldCheck size={13} />
          Zero-knowledge · End-to-end encrypted
        </div>

        <h1 className="bg-gradient-to-b from-white via-white to-violet-400/60 bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent md:text-7xl">
          Your passwords,
          <br />
          sealed in black.
        </h1>

        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          MyPassword encrypts everything in your browser with AES-256 before it ever touches a
          server. No one — not us, not Google, not anyone — can read your vault. Only your master
          password can.
        </p>

        <button
          onClick={signIn}
          className="btn-shimmer group mt-10 inline-flex items-center gap-3 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-3 text-xs text-zinc-600">Free · No card required · Open source</p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 pb-10 sm:grid-cols-3">
        <Feature
          icon={<Cpu size={18} />}
          title="Argon2id KDF"
          desc="Memory-hard key derivation (64 MiB) makes brute-forcing your master password impractical."
        />
        <Feature
          icon={<KeyRound size={18} />}
          title="AES-256-GCM"
          desc="Envelope encryption — a wrapped data key seals every credential before it leaves your device."
        />
        <Feature
          icon={<Fingerprint size={18} />}
          title="Locks itself"
          desc="Auto-locks in minutes, on hidden tabs, and re-verifies you before revealing any secret."
        />
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <GlowCard className="p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
    </GlowCard>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
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
