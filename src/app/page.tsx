"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, PrimaryButton, Spinner } from "@/components/ui";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/vault");
  }, [loading, user, router]);

  if (loading) return <Spinner />;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <GlassCard className="w-full max-w-lg p-10 text-center">
        <div className="mb-4 text-6xl">🔐</div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white">MyPassword</h1>
        <p className="mb-8 text-purple-200/80">
          A zero-knowledge password vault. Everything is encrypted with AES-256 in your browser —
          your master password and secrets never leave your device.
        </p>
        <PrimaryButton onClick={signIn} className="w-full py-3">
          Continue with Google
        </PrimaryButton>
        <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-purple-300/70">
          <div className="glass rounded-xl p-3">Argon2id key derivation</div>
          <div className="glass rounded-xl p-3">AES-256-GCM encryption</div>
          <div className="glass rounded-xl p-3">Client-side only crypto</div>
        </div>
      </GlassCard>
    </div>
  );
}
