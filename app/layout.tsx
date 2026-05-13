import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunningQuest",
  description: "Gamify your running",
};

import BottomNav from '@/components/BottomNav'
import { getCurrentProfile } from '@/lib/auth'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-zinc-950">
        <main className={profile ? 'pb-20' : ''}>{children}</main>
        {profile && <BottomNav />}
      </body>
    </html>
  );
}
