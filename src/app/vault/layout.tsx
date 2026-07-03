import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault",
  description: "Your encrypted credentials — decrypted only in your browser.",
  robots: { index: false, follow: false },
};

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
