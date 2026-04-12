import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GlobalHeader from "@/components/GlobalHeader";
import HeaderSearch from "@/components/HeaderSearch";
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
  title: { default: "서울·수도권 아파트 실거래가·시세 | 살집", template: "%s | 살집" },
  description:
    "서울·수도권 아파트 매매·전세·월세 실거래가와 시세를 텍스트 검색으로 확인하세요. 최근 거래일·거래량·가격 요약 제공. 출처: 국토교통부 실거래가 공개데이터.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://saljip.kr" },
  openGraph: {
    title: "서울·수도권 아파트 실거래가·시세 | 살집",
    description: "서울·수도권 아파트 매매·전세·월세 실거래가와 시세를 텍스트 검색으로 확인하세요. 최근 거래일·거래량·가격 요약 제공.",
    url: "https://saljip.kr",
    type: "website",
    siteName: "살집",
    locale: "ko_KR",
    images: [{ url: "https://saljip.kr/og-default.png", width: 1200, height: 630, alt: "살집" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "서울·수도권 아파트 실거래가·시세 | 살집",
    description: "서울·수도권 아파트 매매·전세·월세 실거래가와 시세를 텍스트 검색으로 확인하세요. 최근 거래일·거래량·가격 요약 제공.",
    images: ["https://saljip.kr/og-default.png"]
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
        <GlobalHeader />
        <div className="global-under-search">
          <div className="global-under-search-inner">
            <Suspense fallback={null}>
              <HeaderSearch />
            </Suspense>
          </div>
        </div>
        {children}
        <footer style={{ borderTop: "1px solid #e2e8f0", marginTop: 24, background: "#fff" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "14px 20px",
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <p style={{ color: "#64748b", fontSize: 13 }}>© {new Date().getFullYear()} 살집 · 데이터 기반 부동산 정보 서비스</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/about" style={{ color: "#0f172a", fontSize: 13, textDecoration: "underline" }}>
                About
              </Link>
              <Link href="/privacy" style={{ color: "#0f172a", fontSize: 13, textDecoration: "underline" }}>
                Privacy
              </Link>
              <Link href="/terms" style={{ color: "#0f172a", fontSize: 13, textDecoration: "underline" }}>
                Terms
              </Link>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}



