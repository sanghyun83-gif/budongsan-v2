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
  const [q, setQ] = useState("");
  const composingRef = useRef(false);

  useEffect(() => {
    if (composingRef.current) return;
    const nextQ = (searchParams.get("q") ?? "").trim();
    setQ((prev) => (prev === nextQ ? prev : nextQ));
  }, [pathname, searchParams]);

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
  );
}
