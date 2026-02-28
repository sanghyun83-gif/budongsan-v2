"use client";

import { useState } from "react";

interface DetailActionBarProps {
  complexId: number;
}

const ACTIONS = [
  { key: "favorite", label: "관심등록 (준비중)" },
  { key: "alert", label: "알림받기 (준비중)" },
  { key: "inquiry", label: "문의하기 (준비중)" }
] as const;

export default function DetailActionBar({ complexId }: DetailActionBarProps) {
  const [pending, setPending] = useState<string | null>(null);

  async function clickAction(action: (typeof ACTIONS)[number]["key"]) {
    setPending(action);
    try {
      await fetch("/api/events/cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          complexId,
          source: "complex_detail"
        })
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="detail-cta-grid">
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          className="ui-button detail-cta-button"
          onClick={() => {
            void clickAction(action.key);
          }}
          disabled={pending !== null}
        >
          {pending === action.key ? "기록중..." : action.label}
        </button>
      ))}
    </section>
  );
}

