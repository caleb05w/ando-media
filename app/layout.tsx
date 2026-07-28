import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Agentation } from "agentation";
import { DialRoot } from "dialkit";
import "./globals.css";
import "dialkit/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ando media",
  description: "Directory of prototypes and experiments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Agentation — annotate any view and copy structured feedback for
            coding agents. Mounted here so every route gets the toolbar.
            Ships its own "use client" boundary, so this layout stays a
            Server Component. */}
        <Agentation />
        {/* DialKit — real-time parameter tweaking. A sibling of {children}
            rather than a wrapper, so it never sits in the render path of the
            routes it adjusts. Also ships its own "use client" boundary. */}
        <DialRoot />
      </body>
    </html>
  );
}
