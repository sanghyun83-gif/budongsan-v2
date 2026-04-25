"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TrendDealItem } from "@/lib/complexes";

interface TradeChartPanelProps {
  deals: TrendDealItem[];
  initialArea?: string;
  complexName?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  dealAmountManwon: number;
  ts?: number;
  dealDate?: string;
}

const COPY = {
  title: "아파트 매매 실거래가 추이",
  areaSelectAriaLabel: "전용면적(평형) 선택",
  allArea: "전체 면적 통합",
  yAxisUnit: "매매가(억원)",
  volumeLegend: "월별 거래량(건)",
  dataSource: "국토교통부 실거래가 공개시스템 기준",
  adjustedToggle: "면적보정 평균가(㎡당 환산)",
  adjustedBadge: "표시 기준: 면적보정 평균가"
} as const;

const SVG_HEIGHT = 200;
const CHART_TOP = 20;
const CHART_LEFT = 54;
const CHART_RIGHT = 10;
const INNER_HEIGHT = 160;
const BAR_MAX_HEIGHT = 24;
const FONT_FAMILY = "var(--font-geist-sans), Arial, Helvetica, sans-serif";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatManwon(value: number): string {
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function formatYm(input: Date): string {
  return `${input.getFullYear()}.${String(input.getMonth() + 1).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function buildMonthRange(start: Date, end: Date) {
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return sorted[mid];
}

function buildMonotonePath(points: ChartPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x.toFixed(3)},${points[0].y.toFixed(3)}`;
  if (points.length === 2) return `M${points[0].x.toFixed(3)},${points[0].y.toFixed(3)}L${points[1].x.toFixed(3)},${points[1].y.toFixed(3)}`;

  const n = points.length;
  const x = points.map((p) => p.x);
  const y = points.map((p) => p.y);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);

  for (let i = 0; i < n - 1; i++) {
    const dx = Math.max(1e-6, x[i + 1] - x[i]);
    d[i] = (y[i + 1] - y[i]) / dx;
  }

  m[0] = d[0];
  m[n - 1] = d[n - 2];

  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      const t = 3 / h;
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }

  let path = `M${x[0].toFixed(3)},${y[0].toFixed(3)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = x[i + 1] - x[i];
    const cp1x = x[i] + dx / 3;
    const cp1y = clamp(y[i] + (m[i] * dx) / 3, 2, INNER_HEIGHT);
    const cp2x = x[i + 1] - dx / 3;
    const cp2y = clamp(y[i + 1] - (m[i + 1] * dx) / 3, 2, INNER_HEIGHT);
    path += `C${cp1x.toFixed(3)},${cp1y.toFixed(3)},${cp2x.toFixed(3)},${cp2y.toFixed(3)},${x[i + 1].toFixed(3)},${y[i + 1].toFixed(3)}`;
  }

  return path;
}

function buildShortRangeTicks(months: string[], innerWidth: number) {
  if (months.length === 0) return [] as Array<{ x: number; label: string }>;
  if (months.length === 1) {
    const d = parseMonthKey(months[0]);
    return [{ x: 0, label: formatYm(d) }];
  }

  const step = (innerWidth - 8) / (months.length - 1);
  const indexSet = new Set<number>([0, months.length - 1]);
  const stride = Math.max(1, Math.round((months.length - 1) / 3));
  for (let i = 0; i < months.length; i += stride) indexSet.add(i);

  return [...indexSet]
    .sort((a, b) => a - b)
    .map((i) => ({ x: i * step, label: formatYm(parseMonthKey(months[i])) }));
}

function computeLabelBox(centerX: number, preferredY: number, text: string, innerWidth: number) {
  const width = Math.max(82, text.length * 6.2 + 12);
  const x = clamp(centerX - width / 2, 0, innerWidth - width);
  const y = clamp(preferredY - 12, 0, 148);
  return { x, y, width, height: 16, textX: x + width / 2, textY: y + 11 };
}

export default function TradeChartPanel({ deals, initialArea = "all", complexName = "해당 단지" }: TradeChartPanelProps) {
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState(570);
  const [useAreaAdjustedAvg, setUseAreaAdjustedAvg] = useState(false);

  useEffect(() => {
    const node = chartWrapRef.current;
    if (!node) return;
    const updateWidth = () => setWrapWidth(Math.round(node.clientWidth || 570));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(320, wrapWidth - CHART_LEFT - CHART_RIGHT);
  const svgViewWidth = CHART_LEFT + innerWidth + CHART_RIGHT;

  const areaOptions = useMemo(() => {
    const uniques = Array.from(new Set(deals.map((d) => Number(d.areaM2.toFixed(2)))));
    return ["all", ...uniques.sort((a, b) => a - b).map((v) => v.toFixed(2))];
  }, [deals]);

  const normalizedInitialArea = areaOptions.includes(initialArea) ? initialArea : "all";
  const [selectedArea, setSelectedArea] = useState<string>(normalizedInitialArea);

  const filteredDeals = useMemo(() => {
    if (selectedArea === "all") return deals;
    return deals.filter((d) => d.areaM2.toFixed(2) === selectedArea);
  }, [deals, selectedArea]);

  const workingDeals = useMemo(() => {
    if (!(selectedArea === "all" && useAreaAdjustedAvg) || filteredDeals.length === 0) {
      return filteredDeals;
    }

    const representativeArea = filteredDeals.reduce((sum, d) => sum + d.areaM2, 0) / filteredDeals.length;

    return filteredDeals.map((d) => {
      const perM2 = d.dealAmountManwon / Math.max(1e-6, d.areaM2);
      const adjustedAmount = Math.round(perM2 * representativeArea);
      return { ...d, dealAmountManwon: adjustedAmount };
    });
  }, [filteredDeals, selectedArea, useAreaAdjustedAvg]);

  const chartData = useMemo(() => {
    if (workingDeals.length === 0) {
      return {
        points: [] as ChartPoint[],
        bars: [] as Array<{ x: number; y: number; h: number; w: number; count: number; monthLabel: string }>,
        xTicks: [] as Array<{ x: number; label: string }>,
        pathD: "",
        recentPathD: "",
        maxDeal: null as { x: number; y: number; v: number } | null,
        minDeal: null as { x: number; y: number; v: number } | null,
        yTicks: ["0억", "50억", "100억", "150억", "200억"],
        periodLabel: "-",
        dealCount: 0,
        recentPointCount: 0,
        recentStartX: null as number | null
      };
    }

    const sorted = [...workingDeals].sort((a, b) => +new Date(a.dealDate) - +new Date(b.dealDate));
    const minDate = new Date(sorted[0].dealDate);
    const maxDate = new Date(sorted[sorted.length - 1].dealDate);

    const minAmount = Math.min(...sorted.map((d) => d.dealAmountManwon));
    const maxAmount = Math.max(...sorted.map((d) => d.dealAmountManwon));

    const minYValue = Math.floor(minAmount / 5000) * 5000;
    const maxYValueBase = Math.ceil(maxAmount / 5000) * 5000;
    const maxYValue = Math.max(maxYValueBase, minYValue + 20000);

    const rawMinTs = +minDate;
    const rawMaxTs = +maxDate;
    const rawRange = Math.max(24 * 60 * 60 * 1000, rawMaxTs - rawMinTs);
    const pad = clamp(rawRange * 0.04, 2 * 24 * 60 * 60 * 1000, 15 * 24 * 60 * 60 * 1000);
    const timeMin = rawMinTs - pad;
    const timeMax = rawMaxTs + pad;
    const timeRange = Math.max(1, timeMax - timeMin);

    const xScale = (time: number) => ((time - timeMin) / timeRange) * (innerWidth - 8);
    const yScale = (amount: number) => {
      const ratio = (amount - minYValue) / Math.max(1, maxYValue - minYValue);
      return clamp(INNER_HEIGHT - ratio * (INNER_HEIGHT - 2), 2, INNER_HEIGHT);
    };

    const points: ChartPoint[] = sorted.map((d) => ({
      x: xScale(+new Date(d.dealDate)),
      y: yScale(d.dealAmountManwon),
      dealAmountManwon: d.dealAmountManwon,
      ts: +new Date(d.dealDate),
      dealDate: d.dealDate
    }));

    const byDay = new Map<string, number[]>();
    for (const d of sorted) {
      const day = d.dealDate.slice(0, 10);
      const arr = byDay.get(day) ?? [];
      arr.push(d.dealAmountManwon);
      byDay.set(day, arr);
    }

    const linePoints: ChartPoint[] = [...byDay.entries()]
      .sort((a, b) => +new Date(a[0]) - +new Date(b[0]))
      .map(([day, values]) => {
        const amount = median(values);
        return {
          x: xScale(+new Date(day)),
          y: yScale(amount),
          dealAmountManwon: amount,
          ts: +new Date(day),
          dealDate: day
        };
      });

    const recentCutTs = +maxDate - 90 * 24 * 60 * 60 * 1000;
    let recentLinePoints = linePoints.filter((p) => (p.ts ?? 0) >= recentCutTs);
    if (recentLinePoints.length < 3) recentLinePoints = [];

    const monthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const monthEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const months = buildMonthRange(monthStart, monthEnd);
    const monthCountMap = new Map<string, number>();

    for (const d of sorted) {
      const key = monthKey(new Date(d.dealDate));
      monthCountMap.set(key, (monthCountMap.get(key) ?? 0) + 1);
    }

    const maxCount = Math.max(1, ...months.map((m) => monthCountMap.get(m) ?? 0));
    const step = months.length > 1 ? (innerWidth - 8) / (months.length - 1) : innerWidth - 8;
    const barWidth = clamp(step * 0.68, 5, 11);

    const bars = months.map((m, i) => {
      const count = monthCountMap.get(m) ?? 0;
      const rawH = count === 0 ? 0 : (count / maxCount) * BAR_MAX_HEIGHT;
      const h = count === 0 ? 0 : Math.max(2, rawH);
      return { x: i * step, y: INNER_HEIGHT - h, h, w: barWidth, count, monthLabel: m };
    });

    let xTicks: Array<{ x: number; label: string }> = [];
    if (months.length <= 18) {
      xTicks = buildShortRangeTicks(months, innerWidth);
    } else {
      const yearTickCandidates: Array<{ x: number; label: string }> = [];
      for (let i = 0; i < months.length; i++) {
        const month = parseMonthKey(months[i]);
        if (month.getMonth() === 0) yearTickCandidates.push({ x: i * step, label: String(month.getFullYear()) });
      }
      xTicks = yearTickCandidates.length > 0 ? yearTickCandidates : buildShortRangeTicks(months, innerWidth);
    }

    const maxPoint = points.reduce((a, b) => (a.dealAmountManwon > b.dealAmountManwon ? a : b));
    const minPoint = points.reduce((a, b) => (a.dealAmountManwon < b.dealAmountManwon ? a : b));

    const yTickValues = [0, 0.25, 0.5, 0.75, 1].map((r) => minYValue + (maxYValue - minYValue) * r);

    return {
      points,
      bars,
      xTicks,
      pathD: buildMonotonePath(linePoints),
      recentPathD: buildMonotonePath(recentLinePoints),
      recentStartX: recentLinePoints.length > 0 ? recentLinePoints[0].x : null,
      maxDeal: { x: maxPoint.x, y: maxPoint.y, v: maxPoint.dealAmountManwon },
      minDeal: { x: minPoint.x, y: minPoint.y, v: minPoint.dealAmountManwon },
      yTicks: yTickValues.map((v) => `${Math.round(v / 10000)}억`),
      periodLabel: `${formatYm(minDate)}~${formatYm(maxDate)}`,
      dealCount: sorted.length,
      recentPointCount: recentLinePoints.length
    };
  }, [workingDeals, innerWidth]);

  const maxText = chartData.maxDeal ? `최고 ${formatManwon(chartData.maxDeal.v)}` : "";
  const minText = chartData.minDeal ? `최저 ${formatManwon(chartData.minDeal.v)}` : "";

  const maxBox = chartData.maxDeal
    ? computeLabelBox(chartData.maxDeal.x, chartData.maxDeal.y - 8, maxText, innerWidth)
    : null;
  let minBox = chartData.minDeal
    ? computeLabelBox(chartData.minDeal.x, chartData.minDeal.y + 16, minText, innerWidth)
    : null;

  if (maxBox && minBox) {
    const overlapX = Math.abs(maxBox.textX - minBox.textX) < (maxBox.width + minBox.width) / 2;
    const overlapY = Math.abs(maxBox.y - minBox.y) < 18;
    if (overlapX && overlapY) {
      minBox = computeLabelBox((chartData.minDeal?.x ?? 0) + 40, (chartData.minDeal?.y ?? 0) + 22, minText, innerWidth);
    }
  }

  const areaLabel = selectedArea === "all" ? COPY.allArea : `${selectedArea}㎡`;
  const chartAriaLabel = `${complexName} 아파트 ${areaLabel} 매매 실거래가 추이 차트`;
  const baseLineClipWidth = chartData.recentStartX === null ? innerWidth + 2 : Math.max(0, chartData.recentStartX - 2);

  return (
    <section style={{ padding: "0px", display: "grid", margin: "15px 0px 0px", fontFamily: FONT_FAMILY, color: "#0f172a", fontWeight: 700 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: "18px", marginBottom: "12px" }}>
        <span>{COPY.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectedArea === "all" && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={useAreaAdjustedAvg}
                onChange={(e) => setUseAreaAdjustedAvg(e.target.checked)}
                aria-label={COPY.adjustedToggle}
              />
              {COPY.adjustedToggle}
            </label>
          )}
          <select
            id="chart-area-select"
            aria-label={COPY.areaSelectAriaLabel}
            value={selectedArea}
            onChange={(e) => {
              const nextArea = e.target.value;
              setSelectedArea(nextArea);
              if (nextArea !== "all") setUseAreaAdjustedAvg(false);
            }}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: 13, fontWeight: 800, padding: "7px 10px", outline: "none" }}
          >
            <option value="all">{COPY.allArea}</option>
            {areaOptions.filter((v) => v !== "all").map((v) => (
              <option key={v} value={v}>{Number(v).toFixed(2)}m²</option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="ui-trust-chip" style={{ fontWeight: 800 }}>데이터 기간: {chartData.periodLabel}</span>
        <span className="ui-trust-chip" style={{ fontWeight: 800 }}>거래건수: {chartData.dealCount}건</span>
        {useAreaAdjustedAvg && <span className="ui-trust-chip" style={{ fontWeight: 800 }}>{COPY.adjustedBadge}</span>}
      </div>

      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4, fontWeight: 800 }}>{COPY.yAxisUnit}</div>

      <div ref={chartWrapRef} style={{ height: "200px", width: "100%" }} className="achachart">
        <svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${svgViewWidth} ${SVG_HEIGHT}`} role="img" aria-label={chartAriaLabel} preserveAspectRatio="xMinYMid meet" style={{ fontWeight: 800 }}>
          <defs>
            <clipPath id="price-base-line-clip">
              <rect x="-4" y="0" width={baseLineClipWidth} height={INNER_HEIGHT + 2} />
            </clipPath>
          </defs>

          <g transform={`translate(${CHART_LEFT},${CHART_TOP})`}>
            {chartData.bars.map((bar, idx) => (
              <rect key={idx} className="volume-bar" x={bar.x} y={bar.y} width={bar.w} height={bar.h} fill="silver" opacity={bar.h === 0 ? 0 : 0.7}>
                <title>{`${bar.monthLabel} 거래량 ${bar.count}건`}</title>
              </rect>
            ))}

            <g transform="translate(0,165)">
              {chartData.xTicks.map((tick) => (
                <text key={`${tick.label}-${tick.x}`} className="year-tick" x={tick.x} y="15" textAnchor="middle" style={{ fill: "#94a3b8", fontSize: "11px", fontFamily: FONT_FAMILY, fontWeight: 800 }}>
                  {tick.label}
                </text>
              ))}
            </g>

            <g fill="none" fontSize="10" fontFamily={FONT_FAMILY} textAnchor="end" style={{ color: "#94a3b8", fontSize: "10px", fontFamily: FONT_FAMILY, fontWeight: 800 }}>
              {[126.5, 95, 63.5, 32, 0.5].map((y, idx) => (
                <g key={y} className="tick" opacity="1" transform={`translate(0,${y})`}>
                  <text fill="currentColor" x="-9" dy="0.32em">{chartData.yTicks[idx]}</text>
                  <line x2={innerWidth} stroke="#f1f5f9" strokeWidth="1" />
                </g>
              ))}
            </g>

            {chartData.points.map((p, idx) => (
              <circle key={idx} className="price-dot regular-dot" cx={p.x} cy={p.y} r="2.4" style={{ fill: "rgb(245, 130, 141)", opacity: 0.32 }}>
                <title>{`${(p.dealDate ?? "").slice(0, 10)} · ${formatManwon(p.dealAmountManwon)}`}</title>
              </circle>
            ))}

            {chartData.pathD && (
              <g clipPath="url(#price-base-line-clip)">
                <path fill="none" stroke="rgb(251, 113, 133)" strokeWidth="2.2" strokeOpacity="0.65" strokeLinecap="round" strokeLinejoin="round" d={chartData.pathD} transform="translate(1.5, 0)" />
              </g>
            )}

            {chartData.recentPathD && (
              <path
                fill="none"
                stroke="rgb(251, 113, 133)"
                strokeWidth="2.2"
                strokeOpacity="0.65"
                strokeLinecap="round"
                strokeLinejoin="round"
                d={chartData.recentPathD}
                transform="translate(1.5, 0)"
              />
            )}

            {chartData.maxDeal && maxBox && (
              <g>
                <circle className="price-dot max-dot" cx={chartData.maxDeal.x} cy={chartData.maxDeal.y} r="2.8" style={{ opacity: 0.9 }} />
                <rect x={maxBox.x} y={maxBox.y} width={maxBox.width} height={maxBox.height} rx={8} ry={8} fill="#fff" stroke="#fecdd3" />
                <text className="price-label" x={maxBox.textX} y={maxBox.textY} textAnchor="middle" style={{ fontSize: "10px", fontWeight: 800, fontFamily: FONT_FAMILY, fill: "rgb(225, 29, 72)" }}>
                  {maxText}
                </text>
              </g>
            )}

            {chartData.minDeal && minBox && (
              <g>
                <circle className="price-dot min-dot" cx={chartData.minDeal.x} cy={chartData.minDeal.y} r="2.8" style={{ opacity: 0.9 }} />
                <rect x={minBox.x} y={minBox.y} width={minBox.width} height={minBox.height} rx={8} ry={8} fill="#fff" stroke="#fecdd3" />
                <text className="price-label" x={minBox.textX} y={minBox.textY} textAnchor="middle" style={{ fontSize: "10px", fontWeight: 800, fontFamily: FONT_FAMILY, fill: "rgb(225, 29, 72)" }}>
                  {minText}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6, color: "#64748b", fontSize: 12, flexWrap: "wrap", fontWeight: 800 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, background: "rgb(225, 29, 72)", display: "inline-block" }} /> 최근 3개월 추이</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, background: "rgb(251, 113, 133)", display: "inline-block" }} /> 실거래가 추이</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, background: "silver", opacity: 0.7, display: "inline-block" }} /> {COPY.volumeLegend}</span>
      </div>

      <p style={{ marginTop: 6, fontSize: 12, color: "#475569", lineHeight: 1.5, fontWeight: 800 }}>
        {complexName} 아파트 {areaLabel} 기준 최근 매매 실거래 {chartData.dealCount}건의 거래가격 및 거래량 추이입니다. {COPY.dataSource}
      </p>
    </section>
  );
}
