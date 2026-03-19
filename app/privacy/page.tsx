import type { Metadata } from "next";

const ANNOUNCED_ON = "2026-03-19";
const EFFECTIVE_ON = "2026-03-19";
const VERSION = "v1.0";

const versionHistory = [
  {
    version: "v1.0",
    announcedOn: "2026-03-19",
    effectiveOn: "2026-03-19",
    summary: "운영본 1차 보강(수집항목/보관기간 표, 위탁/국외이전, 권리행사 절차 추가)",
  },
  {
    version: "v0.9",
    announcedOn: "2026-03-19",
    effectiveOn: "2026-03-19",
    summary: "초안 공개",
  },
];

const collectionRows = [
  {
    item: "서비스 접속 로그(IP, User-Agent, 요청 시각, URL)",
    purpose: "보안 모니터링, 장애 대응, 서비스 안정성 유지",
    retention: "최대 90일",
  },
  {
    item: "검색/조회 이벤트(검색어, 정렬/필터, 클릭 이벤트)",
    purpose: "검색 품질 개선, UX 개선, 통계 분석",
    retention: "최대 180일",
  },
  {
    item: "쿠키/유사 식별자(분석 도구 사용 시)",
    purpose: "트래픽 측정 및 기능 개선",
    retention: "도구 정책 또는 브라우저 설정에 따름",
  },
  {
    item: "문의 접수 정보(이메일, 문의 내용)",
    purpose: "문의 응대, 민원 처리, 이력 관리",
    retention: "문의 처리 완료 후 최대 3년",
  },
];

const processorRows = [
  {
    category: "인프라/호스팅",
    vendor: "Vercel, Inc.",
    purpose: "서비스 배포, 운영 로그 처리",
    overseas: "있음(미국 등 인프라 지역)",
    note: "서비스 제공을 위한 필수 처리",
  },
  {
    category: "분석 도구(선택)",
    vendor: "Google LLC (Google Analytics)",
    purpose: "트래픽/행동 분석",
    overseas: "있음(미국)",
    note: "운영 설정 시에만 사용",
  },
  {
    category: "지도 SDK",
    vendor: "Kakao Corp.",
    purpose: "지도 렌더링 및 위치 기반 기능 제공",
    overseas: "서비스 구성에 따라 상이",
    note: "지도 기능 사용 시 노출",
  },
];

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "살집 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>개인정보처리방침</h1>
      <p className="legal-meta">
        공고일: {ANNOUNCED_ON} · 시행일: {EFFECTIVE_ON} · 버전: {VERSION}
      </p>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. 총칙</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          살집(이하 서비스)은 개인정보보호법 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 처리하기 위해 필요한 정책과 절차를 운영합니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>2. 공고일/시행일/버전 이력</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th>버전</th>
                <th>공고일</th>
                <th>시행일</th>
                <th>주요 변경 내용</th>
              </tr>
            </thead>
            <tbody>
              {versionHistory.map((row) => (
                <tr key={row.version}>
                  <td>{row.version}</td>
                  <td>{row.announcedOn}</td>
                  <td>{row.effectiveOn}</td>
                  <td>{row.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>3. 수집항목·목적·보관기간</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th>수집 항목</th>
                <th>처리 목적</th>
                <th>보관 기간</th>
              </tr>
            </thead>
            <tbody>
              {collectionRows.map((row) => (
                <tr key={row.item}>
                  <td>{row.item}</td>
                  <td>{row.purpose}</td>
                  <td>{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>4. 제3자 제공</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 근거한 요구가 있거나 이용자가 별도 동의한 경우에 한해 제공할 수 있습니다.
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>5. 처리위탁 및 국외이전</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          서비스 운영을 위해 아래와 같이 개인정보 처리업무를 위탁하거나 국외에서 처리될 수 있습니다.
        </p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>수탁/처리 업체</th>
                <th>처리 목적</th>
                <th>국외이전 여부</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {processorRows.map((row) => (
                <tr key={`${row.category}-${row.vendor}`}>
                  <td>{row.category}</td>
                  <td>{row.vendor}</td>
                  <td>{row.purpose}</td>
                  <td>{row.overseas}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>6. 권리행사 방법</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다.
        </p>
        <ul style={{ color: "#334155", lineHeight: 1.6, paddingLeft: 18, display: "grid", gap: 4 }}>
          <li>요청 채널: 아래 문의처 이메일</li>
          <li>본인 확인: 권리행사 보호를 위한 최소 범위 확인 절차 진행</li>
          <li>처리 기한: 관련 법령 및 내부 정책에 따라 지체 없이 처리</li>
        </ul>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>7. 문의처</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          개인정보 관련 문의, 민원 접수, 권리행사 요청은 아래 연락처로 접수해 주세요.
        </p>
        <p className="legal-meta">
          개인정보보호 담당부서: [부서명 입력] · 이메일: [privacy@도메인 입력] · 처리책임자: [이름/직책 입력]
        </p>
      </section>

      <section className="legal-card">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>8. 방침 변경</h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          본 방침은 법령 또는 서비스 정책 변경 시 개정될 수 있으며, 변경 시 공고일/시행일과 함께 본 페이지에 고지합니다.
        </p>
      </section>
    </main>
  );
}
