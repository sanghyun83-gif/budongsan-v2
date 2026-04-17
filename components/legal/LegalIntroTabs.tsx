export default function LegalIntroTabs() {
  return (
    <div className="intro p-3 mb-3 bg-light rounded shadow-s nocap">
      <h6 style={{ fontWeight: 800, marginBottom: 10 }}>계산 및 인지·증지 안내</h6>

      <div className="tab-content" style={{ display: "grid", gap: 10 }}>
        <div className="tab-pane show active" id="intro1">
          <b>1) 계산 기준 안내</b>
          <p style={{ marginTop: 6 }}>
            물건 유형(주택/그 외 건물)과 과세표준을 입력하면 적용보수, 부가세, 총비용을 계산합니다. 여러 시나리오를 비교하려면 계산 후 ‘추가’를 사용하세요.
          </p>
        </div>

        <div className="tab-pane show active" id="intro2">
          <b>2) 공공비용(인지·증지) 안내</b>
          <p style={{ marginTop: 6 }}>
            공공비용 포함을 체크하고 기재금액을 입력하면 수입인지·증지·제증명 비용이 함께 반영됩니다. 해당 항목은 법무사 이용 여부와 별도로 발생할 수 있습니다.
          </p>
        </div>

        <div className="tab-pane show active" id="intro3">
          <b>3) 실무 체크리스트</b>
          <p style={{ marginTop: 6 }}>
            계산 결과는 사전 검토용입니다. 접수 전에는 기준일, 관할기관 안내, 법무사 사무소 최종 견적서를 함께 확인해 최종 비용을 확정하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
