import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "budongsan-v2",
  description: "Korean real estate MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px", display: "flex", gap: 14 }}>
            <Link href="/" style={{ fontWeight: 700, color: "#0f172a", textDecoration: "none" }}>홈</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
