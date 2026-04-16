export default function CommissionRateTable() {
  return (
    <section className="legal-card">
      <h2 style={{ fontWeight: 800, fontSize: 20 }}>중개보수 요율표 (서울 기준)</h2>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>종류</th>
              <th>거래내용</th>
              <th>거래금액</th>
              <th>상한요율</th>
              <th>한도액</th>
            </tr>
          </thead>
          <tbody>
            <tr><td rowSpan={6}>주택(매매)</td><td rowSpan={6}>매매교환</td><td>5천만원 미만</td><td>1천분의 6</td><td>25만원</td></tr>
            <tr><td>5천만원 이상~2억원 미만</td><td>1천분의 5</td><td>80만원</td></tr>
            <tr><td>2억원 이상~9억원 미만</td><td>1천분의 4</td><td>없음</td></tr>
            <tr><td>9억원 이상~12억원 미만</td><td>1천분의 5</td><td>없음</td></tr>
            <tr><td>12억원 이상~15억원 미만</td><td>1천분의 6</td><td>없음</td></tr>
            <tr><td>15억원 이상</td><td>1천분의 7</td><td>없음</td></tr>
            <tr><td rowSpan={2}>오피스텔</td><td>매매교환</td><td>-</td><td>1천분의 5</td><td>없음</td></tr>
            <tr><td>임대차 등</td><td>-</td><td>1천분의 4</td><td>없음</td></tr>
            <tr><td>주택 이외</td><td>기타</td><td>-</td><td>1천분의 9 이내</td><td>협의</td></tr>
          </tbody>
        </table>
      </div>
      <p className="legal-meta">※ 분양권 거래금액 계산: 불입금액(융자 포함)+프리미엄</p>
    </section>
  );
}
