import type { CommissionResult } from "@/lib/commission/types";

function fm(v: number) {
  return `${Math.round(v * 100) / 100}만원`;
}

export default function CommissionResultSummary({ result }: { result: CommissionResult }) {
  return (
    <section className="hub-finance-card">
      <h3 style={{ fontWeight: 800, marginBottom: 8 }}>결과 요약</h3>
      <div className="hub-finance-result-grid">
        <div className="hub-finance-result-item"><span className="hub-finance-result-label">중개보수</span><span className="hub-finance-result-value">{fm(result.commissionManwon)}</span></div>
        <div className="hub-finance-result-item"><span className="hub-finance-result-label">부가세</span><span className="hub-finance-result-value">{fm(result.vatManwon)}</span></div>
        <div className="hub-finance-result-item"><span className="hub-finance-result-label">합계</span><span className="hub-finance-result-value">{fm(result.totalManwon)}</span></div>
      </div>
    </section>
  );
}
