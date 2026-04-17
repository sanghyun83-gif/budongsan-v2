import type { LegalResultRow } from "@/lib/legal/types";
import { formatKrw } from "@/lib/legal/format";
import LegalResultSummary from "@/components/legal/LegalResultSummary";
import LegalResultTable from "@/components/legal/LegalResultTable";

type Props = {
  rows: LegalResultRow[];
  showNumber: boolean;
  visible: boolean;
  onToggleNumber: () => void;
};

export default function LegalResultSection({ rows, showNumber, visible, onToggleNumber }: Props) {
  if (!visible || rows.length === 0) return null;

  const latest = rows[rows.length - 1];

  return (
    <div className="hiding" style={{ display: "grid", gap: 10 }}>
      <LegalResultSummary row={latest} />

      <div id="resultSet">
        <LegalResultTable row={latest} />
      </div>

      {rows.length > 1 ? (
        <details className="legal-card">
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>비교 결과 보기 ({rows.length}건)</summary>
          <div className="custom-control custom-checkbox mb-2 mt-2 d-inline ml-1 nocap">
            <input type="checkbox" id="number" className="custom-control-input" checked={showNumber} onChange={onToggleNumber} />
            <label className="custom-control-label" htmlFor="number">순번</label>
          </div>
          <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <table className="legal-table result">
              <thead>
                <tr>
                  {showNumber ? <th>순번</th> : null}
                  <th>과세표준</th>
                  <th>적용보수</th>
                  <th>부가세</th>
                  <th>공공비용</th>
                  <th>합계</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {showNumber ? <td>{row.seq}</td> : null}
                    <td>{formatKrw(row.amountWon)}</td>
                    <td>{formatKrw(row.feeWon)}</td>
                    <td>{formatKrw(row.vatWon)}</td>
                    <td>{formatKrw(row.publicCostWon)}</td>
                    <td className="total">{formatKrw(row.totalWon)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
