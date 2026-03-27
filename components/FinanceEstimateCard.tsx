"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { estimateFinance } from "@/lib/finance/estimate";

interface FinanceEstimateCardProps {
  complexId?: number;
  aptName?: string;
  defaultPriceManwon: number | null;
  className?: string;
  noSnippet?: boolean;
}

type FinanceApiResponse = {
  ok: boolean;
  sourceLabel?: string;
  updatedAt?: string | null;
  disclaimer?: string;
  estimate?: {
    priceManwon: number;
    loanPrincipalManwon: number;
    monthlyPaymentManwon: number;
    totalInterestManwon: number;
    totalRepaymentManwon: number;
    assumptions: {
      ltvPct: number;
      annualRatePct: number;
      years: number;
      repaymentType: "amortized";
      months: number;
    };
  };
  error?: string;
};

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function parsePositiveNumber(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export default function FinanceEstimateCard({
  complexId,
  aptName,
  defaultPriceManwon,
  className,
  noSnippet = false
}: FinanceEstimateCardProps) {
  const [priceManwon, setPriceManwon] = useState(defaultPriceManwon ? String(defaultPriceManwon) : "");
  const [ltv, setLtv] = useState("60");
  const [annualRate, setAnnualRate] = useState("4");
  const [years, setYears] = useState("30");
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("국토교통부 실거래가 공개데이터");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState("본 계산은 참고용이며 실제 금융 조건과 다를 수 있습니다.");
  const [estimateFromApi, setEstimateFromApi] = useState<FinanceApiResponse["estimate"]>(undefined);

  useEffect(() => {
    if (defaultPriceManwon) setPriceManwon(String(defaultPriceManwon));
  }, [defaultPriceManwon]);

  useEffect(() => {
    trackEvent("finance_estimate_view", {
      complex_id: complexId,
      apt_name: aptName
    });
  }, [complexId, aptName]);

  const fallbackEstimate = useMemo(() => {
    const parsedPrice = parsePositiveNumber(priceManwon, 0);
    if (parsedPrice <= 0) return null;
    return estimateFinance({
      priceManwon: parsedPrice,
      ltvPct: Number(ltv),
      annualRatePct: Number(annualRate),
      years: Number(years),
      repaymentType: "amortized"
    });
  }, [priceManwon, ltv, annualRate, years]);

  useEffect(() => {
    const parsedPrice = parsePositiveNumber(priceManwon, 0);
    if (parsedPrice <= 0) {
      setEstimateFromApi(undefined);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams();
        query.set("price_manwon", String(parsedPrice));
        query.set("ltv", String(Number(ltv)));
        query.set("annual_rate", String(Number(annualRate)));
        query.set("years", String(Number(years)));
        if (complexId) query.set("complex_id", String(complexId));

        const res = await fetch(`/api/hub/finance-estimate?${query.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const json = (await res.json()) as FinanceApiResponse;
        if (!res.ok || !json.ok || !json.estimate) {
          throw new Error(json.error ?? "Finance estimate API failed");
        }
        setEstimateFromApi(json.estimate);
        setSourceLabel(json.sourceLabel ?? "국토교통부 실거래가 공개데이터");
        setUpdatedAt(json.updatedAt ?? null);
        setDisclaimer(json.disclaimer ?? "본 계산은 참고용이며 실제 금융 조건과 다를 수 있습니다.");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "계산 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [priceManwon, ltv, annualRate, years, complexId]);

  const estimate = estimateFromApi ?? fallbackEstimate ?? null;

  return (
    <section
      className={className ?? "hub-finance-card"}
      id="finance-estimator"
      aria-label="금융 연계 계산"
      {...(noSnippet ? { "data-nosnippet": "" } : {})}
    >
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>금융 연계 (월 상환액 추정)</h3>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>
        {aptName ? `${aptName} 기준` : "현재 단지 기준"} · 원리금균등상환 추정
      </p>

      <div className="hub-finance-grid">
        <label className="hub-finance-field">
          <span>매매가(만원)</span>
          <input
            className="ui-input"
            inputMode="numeric"
            value={priceManwon}
            onChange={(e) => {
              const next = e.target.value.replace(/[^0-9]/g, "");
              setPriceManwon(next);
              trackEvent("finance_estimate_change", { field: "price_manwon" });
            }}
          />
        </label>

        {showAssumptions && (
          <>
            <label className="hub-finance-field">
              <span>LTV(%)</span>
              <input
                className="ui-input"
                inputMode="decimal"
                value={ltv}
                onChange={(e) => {
                  setLtv(e.target.value.replace(/[^0-9.]/g, ""));
                  trackEvent("finance_estimate_change", { field: "ltv" });
                }}
              />
            </label>
            <label className="hub-finance-field">
              <span>금리(연 %)</span>
              <input
                className="ui-input"
                inputMode="decimal"
                value={annualRate}
                onChange={(e) => {
                  setAnnualRate(e.target.value.replace(/[^0-9.]/g, ""));
                  trackEvent("finance_estimate_change", { field: "annual_rate" });
                }}
              />
            </label>
            <label className="hub-finance-field">
              <span>상환기간(년)</span>
              <input
                className="ui-input"
                inputMode="numeric"
                value={years}
                onChange={(e) => {
                  setYears(e.target.value.replace(/[^0-9]/g, ""));
                  trackEvent("finance_estimate_change", { field: "years" });
                }}
              />
            </label>
          </>
        )}
      </div>

      {error && <p className="ui-error" style={{ marginTop: 8 }}>{error}</p>}

      <div className="hub-finance-result-grid">
        <article className="hub-finance-result-item">
          <p className="hub-finance-result-label">예상 대출원금</p>
          <p className="hub-finance-result-value">{estimate ? formatManwon(estimate.loanPrincipalManwon) : "-"}</p>
        </article>
        <article className="hub-finance-result-item">
          <p className="hub-finance-result-label">월 상환액 예상</p>
          <p className="hub-finance-result-value">{estimate ? formatManwon(estimate.monthlyPaymentManwon) : "-"}</p>
        </article>
        <article className="hub-finance-result-item">
          <p className="hub-finance-result-label">총이자(예상)</p>
          <p className="hub-finance-result-value">{estimate ? formatManwon(estimate.totalInterestManwon) : "-"}</p>
        </article>
      </div>

      <div className="hub-finance-actions">
        <button
          type="button"
          className="ui-button"
          onClick={() => {
            setShowAssumptions((prev) => !prev);
            trackEvent("finance_cta_click", { cta: "toggle_assumptions" });
          }}
        >
          상환 계산 더보기
        </button>
        <button
          type="button"
          className="ui-button hub-button-muted"
          disabled
          title="준비중"
          onClick={() => trackEvent("finance_cta_click", { cta: "loan_consult_coming_soon" })}
        >
          대출 상담 준비중
        </button>
        {loading && <span style={{ color: "#64748b", fontSize: 12 }}>계산 업데이트 중...</span>}
      </div>

      <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>{disclaimer}</p>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
        기준: {sourceLabel}
        {updatedAt ? ` · 업데이트 ${new Date(updatedAt).toLocaleString("ko-KR")}` : ""}
      </p>
    </section>
  );
}
