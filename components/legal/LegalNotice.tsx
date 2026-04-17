import Link from "next/link";

export default function LegalNotice() {
  return (
    <div className="p-3 my-3 alert-danger rounded nocap">
      <h5>안내 및 유의사항</h5>
      본 결과는 사용자가 입력한 값에 따라 자동 계산된 참고용 금액입니다. 실제 등기 진행 시에는 사건 난이도, 관할, 추가 대행 항목, 방문 횟수 등에 따라
      견적이 달라질 수 있으므로 계약 전에 반드시 법무사 사무소의 최종 견적서를 확인하세요.
      <br />
      기준표는 최신 공지 기준으로 반영하되, 제도·고시 개정 시 계산 결과와 차이가 생길 수 있습니다. 개정 공지와 원문 파일을 함께 검토해 주세요.
      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-sm btn-light">
          <Link href="/legal#policy-section">보수기준 요약(현재창)</Link>
        </button>
        <button className="btn btn-sm btn-light">
          <Link href="/legal#policy-section" target="_blank" rel="noopener noreferrer">보수기준 요약(새창)</Link>
        </button>
      </div>
    </div>
  );
}
