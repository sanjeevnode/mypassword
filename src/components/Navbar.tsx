"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Lock, LogOut, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { status, lock } = useVault();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="transition group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.7)]">
            <Logo size={30} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            My<span className="text-violet-400">Password</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            <NavLink href="/vault" active={pathname === "/vault"} icon={<ShieldCheck size={14} />}>
              Vault
            </NavLink>
            <NavLink href="/profile" active={pathname === "/profile"} icon={<User size={14} />}>
              Profile
            </NavLink>
            {!!process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
              user.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase() && (
                <NavLink href="/admin" active={pathname === "/admin"} icon={<Gauge size={14} />}>
                  Admin
                </NavLink>
              )}
            <div className="mx-2 h-5 w-px bg-white/10" />
            {status === "unlocked" && (
              <button
                onClick={lock}
                title="Lock vault"
                className="btn-ghost flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
              >
                <Lock size={13} /> Lock
              </button>
            )}
            <button
              onClick={logOut}
              title="Sign out"
              className="btn-ghost ml-1 flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-none px-3 py-1.5 text-[13px] font-medium transition",
        active
          ? "bg-violet-500/15 text-violet-300"
          : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
