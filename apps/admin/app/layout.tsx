import "./globals.css";
import type { Metadata } from "next";
import { Nunito, Roboto_Mono } from "next/font/google";
import type { ReactNode } from "react";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito"
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono"
});

export const metadata: Metadata = {
  title: "Fitrah Scholar Dashboard",
  description: "Mobile-first scholar workspace for recording, reviewing, and approving reflections"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${nunito.variable} ${robotoMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
