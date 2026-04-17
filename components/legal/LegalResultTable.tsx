import type { LegalResultRow } from "@/lib/legal/types";
import { formatKrw } from "@/lib/legal/format";

export default function LegalResultTable({ row }: { row: LegalResultRow }) {
  return (
    <section className="legal-table-wrap">
      <table className="legal-table">
        <tbody>
          <tr><th>과세표준</th><td>{formatKrw(row.amountWon)}</td></tr>
          <tr><th>기본보수</th><td>{formatKrw(row.basicFeeWon)}</td></tr>
          <tr><th>누진가산</th><td>{formatKrw(row.progressiveAddWon)}</td></tr>
          <tr><th>유형가감</th><td>{formatKrw(row.typeAdjustmentWon)}</td></tr>
          <tr><th>보수산출액</th><td>{formatKrw(row.feeBeforeVatWon)}</td></tr>
          <tr><th>보수상한</th><td>{formatKrw(row.feeCapWon)}</td></tr>
          <tr><th>적용보수</th><td>{formatKrw(row.feeWon)}</td></tr>
          <tr><th>부가세</th><td>{formatKrw(row.vatWon)}</td></tr>
          <tr><th>수입인지</th><td>{formatKrw(row.stampDutyWon)}</td></tr>
          <tr><th>증지대</th><td>{formatKrw(row.localStampWon)}</td></tr>
          <tr><th>제증명</th><td>{formatKrw(row.certificateWon)}</td></tr>
          <tr><th>공공비용</th><td>{formatKrw(row.publicCostWon)}</td></tr>
          <tr><th>합계</th><td id="legal-react-total"><b>{formatKrw(row.totalWon)}</b></td></tr>
        </tbody>
      </table>
    </section>
  );
}
