"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type HeaderSearchProps = {
  compact?: boolean;
};

export default function HeaderSearch({ compact = false }: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => (searchParams.get("q") ?? "").trim());
  const composingRef = useRef(false);
  const showSeoIntro = !compact && (pathname === "/" || pathname === "/search");

  useEffect(() => {
    const keyword = q.trim();
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    if (!keyword) {
      if (currentPath === "/search" && currentSearch) {
        router.replace("/search");
      }
      return;
    }

    const targetUrl = `/search?q=${encodeURIComponent(keyword)}`;
    const currentUrl = `${currentPath}${currentSearch}`;
    if (currentUrl !== targetUrl) {
      router.replace(targetUrl);
    }
  }, [q, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  }

  return (
    <div className="header-search-wrap">
      {showSeoIntro ? (
        <div className="header-search-intro" aria-label="부동산 검색 소개">
          <p className="header-search-intro-title">서울·수도권 아파트 실거래가 검색</p>
          <p className="header-search-intro-desc">아파트명·지역명으로 매매·전세·월세 실거래가를 빠르게 확인하세요. 최근 거래일, 가격 추이, 거래량 요약 정보를 제공합니다.</p>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className={`header-search-form ${compact ? "is-compact" : ""}`}>
        <span className="header-search-icon" aria-hidden>
          🔍
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            setQ(e.currentTarget.value);
          }}
          placeholder="아파트명, 지역명 검색"
          className="header-search-input"
        />
      </form>
    </div>
  );
}
