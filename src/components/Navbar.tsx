"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Lock, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { status, lock } = useVault();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the sidebar on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isAdmin =
    !!process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
    user?.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase();

  const links = [
    { href: "/vault", label: "Vault", icon: <ShieldCheck size={14} /> },
    { href: "/profile", label: "Profile", icon: <User size={14} /> },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: <Gauge size={14} /> }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-black/60 backdrop-blur-xl">
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
          <>
            {/* desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} active={pathname === l.href} icon={l.icon}>
                  {l.label}
                </NavLink>
              ))}
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
                className="btn-ghost ml-1 flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
              >
                <LogOut size={13} />
              </button>
            </div>

            {/* mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="btn-ghost rounded-none p-2 text-zinc-300 hover:text-white md:hidden"
            >
              <Menu size={18} />
            </button>
          </>
        )}
      </div>

      {/* mobile sidebar */}
      {user && (
        <div
          className={cn(
            "fixed inset-0 z-50 md:hidden",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* backdrop */}
          <div
            onClick={() => setOpen(false)}
            className={cn(
              "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0"
            )}
          />
          {/* panel */}
          <aside
            className={cn(
              "absolute right-0 top-0 flex h-full w-72 flex-col border-l border-violet-500/25 bg-[#0e0c16] shadow-[-20px_0_60px_rgba(0,0,0,0.8)] transition-transform duration-300",
              open ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Logo size={26} />
                <span className="text-sm font-semibold text-white">
                  My<span className="text-violet-400">Password</span>
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1.5 text-zinc-400 transition hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition",
                    pathname === l.href
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {l.icon}
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-1 border-t border-white/8 p-4">
              <p className="truncate px-4 pb-2 text-xs text-zinc-500">{user.email}</p>
              {status === "unlocked" && (
                <button
                  onClick={() => {
                    lock();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Lock size={14} /> Lock vault
                </button>
              )}
              <button
                onClick={logOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
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
          : "text-zinc-300 hover:bg-white/4 hover:text-white"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
