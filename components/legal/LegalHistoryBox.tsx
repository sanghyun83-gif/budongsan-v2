import type { LegalHistoryItem } from "@/lib/legal/types";

type Props = {
  open: boolean;
  items: LegalHistoryItem[];
  onToggle: () => void;
  onClose: () => void;
  onSelect: (item: LegalHistoryItem) => void;
};

export default function LegalHistoryBox({ open, items, onToggle, onClose, onSelect }: Props) {
  return (
    <div className="position-relative">
      <div id="historyBox" className="pt-1 px-3 rounded-bottom click" onClick={onToggle}>
        <div>
          <i className="bi bi-clock-history" /> 나의 계산 기록&nbsp;
          <span className="badge badge-info historyCount d-inline-block" style={{ marginTop: -1 }}>
            {items.length}
          </span>
          <span
            className="float-right close-up"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            style={{ display: open ? "inline" : "none" }}
          >
            닫기 ▲
          </span>
        </div>
        <div id="historyList" style={{ display: open ? "block" : "none" }}>
          {items.map((item) => (
            <button
              key={item.id}
              className="history-item"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
