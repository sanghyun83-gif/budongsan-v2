import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://saljip.kr"),
  title: { default: "살집 | saljip.kr", template: "%s | 살집" },
  description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://saljip.kr" },
  openGraph: {
    title: "살집 | saljip.kr",
    description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
    url: "https://saljip.kr",
    type: "website",
    siteName: "살집",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "살집" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "살집 | saljip.kr",
    description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
    images: ["/og-default.png"]
  },
  icons: {
    icon: ["/favicon-32x32.png", "/favicon-16x16.png", "/favicon.ico"],
    apple: "/apple-touch-icon.png"
  },
  verification: {
    google: "0LZoKgsWmaQ4yR9KcvPm5aykE5ZGH98tZdJ5C2bmyyg",
    other: {
      "naver-site-verification": "329ee64d10952d1c7fa4ed3e7598725b9dc4aae3"
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        ) : null}
        <nav style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px", display: "flex", gap: 14 }}>
            <Link href="/" style={{ fontWeight: 700, color: "#0f172a", textDecoration: "none" }}>홈</Link>
          </div>
        </nav>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}



