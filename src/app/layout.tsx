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

const SITE_URL = "https://mypassword.sanjeevnode.in";
const TITLE = "MyPassword — The Password Manager That Knows Nothing";
const DESCRIPTION =
  "Zero-knowledge password manager. Every credential is encrypted with AES-256-GCM in your browser using Argon2id key derivation — your master password and secrets never leave your device.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · MyPassword",
  },
  description: DESCRIPTION,
  applicationName: "MyPassword",
  keywords: [
    "password manager",
    "zero knowledge",
    "end-to-end encryption",
    "AES-256",
    "Argon2id",
    "password vault",
    "secure credentials",
    "open source password manager",
  ],
  authors: [{ name: "Sanjeev Singh", url: "https://github.com/sanjeevnode" }],
  creator: "Sanjeev Singh",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MyPassword",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/icon.svg", width: 64, height: 64, alt: "MyPassword logo" }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "security",
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
