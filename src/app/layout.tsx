import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { VaultProvider } from "@/context/VaultContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyPassword — Secure Password Vault",
  description: "Zero-knowledge password manager. Your secrets never leave your device unencrypted.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="bg-grid pointer-events-none fixed inset-0 z-0" />
        <AuthProvider>
          <VaultProvider>
            <div className="relative z-10">
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
            </div>
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
