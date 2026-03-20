"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type LivabilityItem = {
  label: "좋음" | "보통" | "아쉬움" | "데이터 준비중";
  metric: string;
  detail: string;
};

type LivabilityResponse = {
  ok: boolean;
  sourceLabel?: string;
  updatedAt?: string | null;
  methodNote?: string;
  complex?: {
    id: number;
    aptName: string;
    legalDong: string;
    regionCode: string;
    regionName: string;
  } | null;
  livability?: {
    traffic: LivabilityItem;
    education: LivabilityItem;
    convenience: LivabilityItem;
  };
  error?: string;
};

interface LivabilitySummaryCardProps {
  complexId: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

function labelClassName(label: LivabilityItem["label"]): string {
  if (label === "좋음") return "hub-livability-chip hub-livability-chip-good";
  if (label === "보통") return "hub-livability-chip hub-livability-chip-normal";
  if (label === "아쉬움") return "hub-livability-chip hub-livability-chip-low";
  return "hub-livability-chip hub-livability-chip-pending";
}

export default function LivabilitySummaryCard({
  complexId,
  title = "생활 인프라 요약",
  subtitle,
  className
}: LivabilitySummaryCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("국토교통부 실거래가 공개데이터 + 내부 좌표 집계(1차)");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [methodNote, setMethodNote] = useState(
    "생활 인프라 1차 버전은 내부 좌표/거래 밀도 기반 추정치입니다."
  );
  const [items, setItems] = useState<LivabilityResponse["livability"] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const res = await fetch(`/api/hub/livability?complex_id=${complexId}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const json = (await res.json()) as LivabilityResponse;
        if (!res.ok || !json.ok || !json.livability) {
          throw new Error(json.error ?? "Livability API failed");
        }
        setItems(json.livability);
        setSourceLabel(json.sourceLabel ?? "국토교통부 실거래가 공개데이터 + 내부 좌표 집계(1차)");
        setUpdatedAt(json.updatedAt ?? null);
        setMethodNote(json.methodNote ?? "생활 인프라 1차 버전은 내부 좌표/거래 밀도 기반 추정치입니다.");

        trackEvent("livability_view", { complex_id: complexId });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "생활 인프라 정보를 불러오지 못했습니다.");
        setItems(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [complexId]);

  return (
    <section className={className ?? "hub-livability-card"} aria-label={title}>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      {subtitle && <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>{subtitle}</p>}

      {loading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
      {error && <p className="ui-error">{error}</p>}

      {!loading && !error && items && (
        <div className="hub-livability-grid">
          <article className="hub-livability-item">
            <div className="hub-livability-item-head">
              <p style={{ fontWeight: 700 }}>교통</p>
              <span className={labelClassName(items.traffic.label)}>{items.traffic.label}</span>
            </div>
            <p className="hub-trend-meta">{items.traffic.metric}</p>
            {showDetail && <p className="hub-livability-detail">{items.traffic.detail}</p>}
          </article>
          <article className="hub-livability-item">
            <div className="hub-livability-item-head">
              <p style={{ fontWeight: 700 }}>교육</p>
              <span className={labelClassName(items.education.label)}>{items.education.label}</span>
            </div>
            <p className="hub-trend-meta">{items.education.metric}</p>
            {showDetail && <p className="hub-livability-detail">{items.education.detail}</p>}
          </article>
          <article className="hub-livability-item">
            <div className="hub-livability-item-head">
              <p style={{ fontWeight: 700 }}>편의</p>
              <span className={labelClassName(items.convenience.label)}>{items.convenience.label}</span>
            </div>
            <p className="hub-trend-meta">{items.convenience.metric}</p>
            {showDetail && <p className="hub-livability-detail">{items.convenience.detail}</p>}
          </article>
        </div>
      )}

      {!loading && !error && items && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="ui-button hub-button-muted"
            onClick={() => {
              const next = !showDetail;
              setShowDetail(next);
              trackEvent("livability_expand_click", { complex_id: complexId, expanded: next });
            }}
          >
            {showDetail ? "근거 접기" : "근거 더보기"}
          </button>
        </div>
      )}

      <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>{methodNote}</p>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
        기준: {sourceLabel}
        {updatedAt ? ` · 업데이트 ${new Date(updatedAt).toLocaleString("ko-KR")}` : ""}
      </p>
    </section>
  );
}
