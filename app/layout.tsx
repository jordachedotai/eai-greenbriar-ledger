import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "../styles/globals.css";

// Self-hosted at build time by next/font, so the room needs no network.
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans-src" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-serif-src" });

export const metadata: Metadata = {
  title: "Greenbriar Portfolio Initiative Ledger",
  description: "What each management team committed to, what they wrote about it month by month, and where to push before the next call.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
