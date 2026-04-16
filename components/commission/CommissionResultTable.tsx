import type { CommissionResult } from "@/lib/commission/types";

function fm(v: number | null) {
  if (v === null) return "없음";
  return `${Math.round(v * 100) / 100}만원`;
}

export default function CommissionResultTable({ result }: { result: CommissionResult }) {
  return (
    <section className="legal-table-wrap">
      <table className="legal-table">
        <tbody>
          <tr><th>거래금액(기준)</th><td>{fm(result.transactionAmountManwon)}</td></tr>
          <tr><th>적용 요율</th><td>{result.rateLabel}</td></tr>
          <tr><th>한도액</th><td>{fm(result.upperLimitManwon)}</td></tr>
          <tr><th>중개보수</th><td>{fm(result.commissionManwon)}</td></tr>
          <tr><th>부가세</th><td>{fm(result.vatManwon)} ({(result.vatRate * 100).toFixed(1)}%)</td></tr>
          <tr><th>합계</th><td id="commission-react-total"><b>{fm(result.totalManwon)}</b></td></tr>
        </tbody>
      </table>
    </section>
  );
}
