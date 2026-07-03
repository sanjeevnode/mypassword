import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Account settings, master password rotation, and vault import/export.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
