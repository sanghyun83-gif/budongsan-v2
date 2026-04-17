"use client";

import Link from "next/link";

export default function GlobalHeader() {
  const showMockLink = process.env.NEXT_PUBLIC_SHOW_MOCK_LINK === "1";

  return (
    <header className="global-header">
      <div className="global-header-inner">
        <Link href="/" className="global-header-logo" aria-label="살집 홈">
          <span className="global-header-logo-mark" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 10.2L12 4L19.5 10.2V19.5H4.5V10.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 19.5V13.2H15V19.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M7 9.5L10 7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M13 11.5L15.2 9.8L17.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="17.5" cy="8" r="1.1" fill="currentColor" />
            </svg>
          </span>
          <span className="global-header-logo-text">살집</span>
        </Link>

        <div />

        <nav className="global-header-menu" aria-label="주요 메뉴">
          <Link href="/commission" className="global-header-menu-link">중개보수 계산기</Link>
          <Link href="/legal" className="global-header-menu-link">법무사 보수 계산기</Link>
          {showMockLink ? <Link href="/mock/commission" className="global-header-menu-link">중개보수(모방)</Link> : null}
          <Link href="/about" className="global-header-menu-link">서비스 소개</Link>
        </nav>
      </div>
    </header>
  );
}
