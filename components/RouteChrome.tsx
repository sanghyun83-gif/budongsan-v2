"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import GlobalHeader from "@/components/GlobalHeader";
import HeaderSearch from "@/components/HeaderSearch";

export default function RouteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/mock/commission");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
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
    </>
  );
}
