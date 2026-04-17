import type { LegalResultRow } from "@/lib/legal/types";
import { formatKrw } from "@/lib/legal/format";

export default function LegalResultSummary({ row }: { row: LegalResultRow }) {
  return (
    <section className="hub-finance-card">
      <h3 style={{ fontWeight: 800, marginBottom: 8 }}>결과 요약</h3>
      <div className="hub-finance-result-grid">
        <div className="hub-finance-result-item">
          <span className="hub-finance-result-label">적용보수</span>
          <span className="hub-finance-result-value">{formatKrw(row.feeWon)}</span>
        </div>
        <div className="hub-finance-result-item">
          <span className="hub-finance-result-label">부가세</span>
          <span className="hub-finance-result-value">{formatKrw(row.vatWon)}</span>
        </div>
        <div className="hub-finance-result-item">
          <span className="hub-finance-result-label">공공비용</span>
          <span className="hub-finance-result-value">{formatKrw(row.publicCostWon)}</span>
        </div>
        <div className="hub-finance-result-item">
          <span className="hub-finance-result-label">합계</span>
          <span className="hub-finance-result-value">{formatKrw(row.totalWon)}</span>
        </div>
      </div>
    </section>
  );
}
