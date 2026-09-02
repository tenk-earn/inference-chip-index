import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Inference Chip Index",
  description: "Find the fastest verified inference hardware for your workload. MLPerf Inference v6.0 Closed division, source-linked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">{children}</main>
      </body>
    </html>
  );
}
