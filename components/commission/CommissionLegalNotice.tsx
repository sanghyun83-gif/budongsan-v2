export default function CommissionLegalNotice() {
  return (
    <section className="legal-card">
      <h2 style={{ fontWeight: 800, fontSize: 20 }}>법적 고지 및 기준</h2>
      <ul style={{ color: "#334155", lineHeight: 1.7, paddingLeft: 18 }}>
        <li>본 계산 결과는 참고용이며 법적 효력을 갖지 않습니다.</li>
        <li>기본 계산 기준은 서울특별시 상한요율표입니다.</li>
        <li>지역별 조례, 계약 형태, 중개사 협의에 따라 실제 금액이 달라질 수 있습니다.</li>
        <li>중요한 의사결정 전에는 반드시 공인중개사/세무 전문가와 확인하세요.</li>
      </ul>
      <p className="legal-meta">업데이트 기준: 2026-04-16</p>
    </section>
  );
}
