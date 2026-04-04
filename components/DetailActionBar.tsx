"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { hasStoredId, toggleStoredId } from "@/lib/clientPrefs";

interface DetailActionBarProps {
  complexId: number;
}

const FAVORITE_KEY = "saljip:favorites:v1";
const ALERT_KEY = "saljip:alerts:v1";

export default function DetailActionBar({ complexId }: DetailActionBarProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(false);

  useEffect(() => {
    trackEvent("view_complex_detail", {
      complex_id: complexId
    });
    setFavorited(hasStoredId(FAVORITE_KEY, complexId));
    setAlertEnabled(hasStoredId(ALERT_KEY, complexId));
  }, [complexId]);

  async function clickAction(action: "favorite" | "alert") {
    setPending(action);
    trackEvent("cta_click", {
      action,
      complex_id: complexId,
      source: "complex_detail"
    });
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
      <button
        type="button"
        className="ui-button detail-cta-button"
        onClick={() => {
          const next = toggleStoredId(FAVORITE_KEY, complexId);
          setFavorited(next);
          void clickAction("favorite");
        }}
        disabled={pending !== null}
      >
        {pending === "favorite" ? "기록중..." : favorited ? "관심해제" : "관심등록"}
      </button>

      <button
        type="button"
        className="ui-button detail-cta-button"
        onClick={() => {
          const next = toggleStoredId(ALERT_KEY, complexId);
          setAlertEnabled(next);
          void clickAction("alert");
        }}
        disabled={pending !== null}
      >
        {pending === "alert" ? "기록중..." : alertEnabled ? "알림해제" : "알림받기"}
      </button>

    </section>
  );
}
