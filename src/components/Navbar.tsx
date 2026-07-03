"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { GhostButton } from "./ui";

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { status, lock } = useVault();

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <nav className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-purple-100">
            <span className="text-xl">🔐</span> MyPassword
          </Link>
          {user && (
            <div className="flex items-center gap-2">
              <Link href="/vault" className="px-3 py-1.5 text-sm text-purple-200 hover:text-white transition">
                Vault
              </Link>
              <Link href="/profile" className="px-3 py-1.5 text-sm text-purple-200 hover:text-white transition">
                Profile
              </Link>
              {status === "unlocked" && (
                <GhostButton onClick={lock} title="Lock vault">
                  🔒 Lock
                </GhostButton>
              )}
              <GhostButton onClick={logOut}>Sign out</GhostButton>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
