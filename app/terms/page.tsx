import type { Metadata } from "next";

const ANNOUNCED_ON = "2026-03-19";
const EFFECTIVE_ON = "2026-03-19";
const VERSION = "v1.0";

export const metadata: Metadata = {
  title: "이용약관",
  description: "살집 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>이용약관</h1>
      <p className="legal-meta">
        공고일: {ANNOUNCED_ON} · 시행일: {EFFECTIVE_ON} · 버전: {VERSION}
      </p>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. 목적</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          본 약관은 살집 서비스 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>2. 서비스 내용 및 변경</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스는 부동산 실거래 정보 검색, 지도 기반 조회, 단지 상세 정보 제공 기능을 제공합니다. 운영상 필요 시 서비스 일부가 변경, 추가 또는 중단될 수 있습니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>3. 이용자의 의무 및 금지행위</h2>
        <ul style={{ color: "#334155", lineHeight: 1.6, paddingLeft: 18, display: "grid", gap: 4 }}>
          <li>관련 법령 및 본 약관을 준수해야 합니다.</li>
          <li>서비스를 통한 불법행위, 자동화된 과도 요청, 서비스 운영 방해 행위를 금지합니다.</li>
          <li>서비스 내 데이터/콘텐츠의 무단 복제, 재배포, 상업적 재이용을 금지합니다.</li>
        </ul>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>4. 책임의 한계</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스에서 제공되는 정보는 참고용이며, 거래/투자/계약에 대한 최종 판단과 책임은 이용자에게 있습니다. 회사는 법령상 허용되는 범위 내에서 간접손해 및 특별손해에 대한 책임을 부담하지 않습니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>5. 서비스 이용 제한</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          시스템 점검, 장애, 외부 연동 이슈, 불가항력 등의 사유가 발생한 경우 서비스 제공이 일시적으로 제한될 수 있습니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>6. 지식재산권</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스의 UI, 코드, 문서, 데이터 가공 결과물에 대한 권리는 회사 또는 정당한 권리자에게 귀속됩니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>7. 약관의 개정</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          회사는 관련 법령 또는 운영 정책 변경에 따라 약관을 개정할 수 있으며, 개정 시 공고일 및 시행일을 명시해 사전 고지합니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>8. 준거법 및 관할</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          본 약관은 대한민국 법령을 준거법으로 하며, 서비스와 관련해 분쟁이 발생한 경우 관련 법령에 따른 관할 법원을 따릅니다.
        </p>
      </section>
    </main>
  );
}
