import type { CommissionHistoryItem } from "@/lib/commission/history";

function fm(v: number) {
  return `${Math.round(v * 100) / 100}만원`;
}

export default function CommissionHistory({ items, onSelect, onClear }: { items: CommissionHistoryItem[]; onSelect: (item: CommissionHistoryItem) => void; onClear: () => void }) {
  if (items.length === 0) return null;

  return (
    <section className="legal-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontWeight: 800 }}>최근 계산 기록</h3>
        <button type="button" className="ui-button hub-button-muted" onClick={onClear}>기록 비우기</button>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.slice(0, 5).map((item) => (
          <button key={item.id} type="button" className="ui-card-link" onClick={() => onSelect(item)}>
            <span>{new Date(item.createdAt).toLocaleString("ko-KR")}</span>
            <span>{fm(item.result.totalManwon)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
