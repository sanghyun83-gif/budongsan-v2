import type { Metadata } from "next";

const ANNOUNCED_ON = "2026-03-19";
const EFFECTIVE_ON = "2026-03-19";
const VERSION = "v1.0";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "살집 서비스 소개, 데이터 출처, 운영 원칙 안내",
};

export default function AboutPage() {
  return (
    <main className="legal-page">
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>About 살집</h1>
      <p className="legal-meta">
        공고일: {ANNOUNCED_ON} · 시행일: {EFFECTIVE_ON} · 버전: {VERSION}
      </p>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. 서비스 목적</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          살집은 아파트 실거래 데이터를 검색/지도/요약 형태로 제공해 사용자가 시장 상황을 빠르게 파악할 수 있도록 돕는 데이터 기반 서비스입니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>2. 제공 기능</h2>
        <ul style={{ color: "#334155", lineHeight: 1.6, paddingLeft: 18, display: "grid", gap: 4 }}>
          <li>키워드/지역코드 기반 단지 검색</li>
          <li>지도 바운드 기반 결과 필터링</li>
          <li>정렬 옵션(최신순, 가격순, 거래수)</li>
          <li>단지 상세 및 최근 거래 스냅샷</li>
          <li>좌표 품질 배지 제공(exact/approx)</li>
        </ul>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>3. 데이터 출처와 기준</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          주요 데이터 출처는 국토교통부 실거래가 공개데이터이며, 각 화면에 출처와 최종 업데이트 시각을 함께 표시합니다.
        </p>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          지도 좌표는 품질 기준에 따라 정확(exact) 또는 근사(approx)로 구분해 노출합니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>4. 운영 원칙</h2>
        <ul style={{ color: "#334155", lineHeight: 1.6, paddingLeft: 18, display: "grid", gap: 4 }}>
          <li>출처/기준 시각을 명시합니다.</li>
          <li>정렬/필터/지도 결과의 일관성을 지속 점검합니다.</li>
          <li>품질 지표(exactRatio/failRatio)를 기준으로 좌표 품질을 관리합니다.</li>
          <li>기능 및 정책 변경 시 문서와 페이지를 함께 갱신합니다.</li>
        </ul>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>5. 면책 고지</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          본 서비스의 정보는 참고용으로 제공되며, 매매/투자/계약 등 최종 의사결정 책임은 이용자에게 있습니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>6. 문의</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스 운영 또는 데이터 관련 문의는 아래 연락처로 접수할 수 있습니다.
        </p>
        <p className="legal-meta">
          문의 이메일: [운영 문의 이메일 입력] · 담당자: [담당자/팀명 입력]
        </p>
      </section>
    </main>
  );
}
