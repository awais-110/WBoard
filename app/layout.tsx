/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ScrollToHash from '@/components/ScrollToHash'

export const metadata: Metadata = {
  title: "IdeaSpace - Collaborate, Create, Innovate",
  description: "IdeaSpace is your digital canvas for collaborative creativity. Design, brainstorm, and build amazing things together in real-time.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Instrument+Serif:opsz,wght@8..144,600&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`html { visibility: hidden; opacity: 0; transition: opacity 0.2s ease; }`}</style>
      </head>
      <body className="antialiased">
        {children}
        <ScrollToHash />
        <Toaster position="top-right" />
        <Script src="/fouc-fix.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
