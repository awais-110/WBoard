import type { Metadata } from "next";
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
      <body className="antialiased">
        {children}
        <ScrollToHash />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
