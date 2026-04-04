import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ComplexListingsTab from "@/components/ComplexListingsTab";
import DetailActionBar from "@/components/DetailActionBar";
import FinanceEstimateCard from "@/components/FinanceEstimateCard";
import LivabilitySummaryCard from "@/components/LivabilitySummaryCard";
import { getComplexDealsById, getComplexSummaryById } from "@/lib/complexes";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

type DetailTab = "price" | "listings" | "info" | "story";

type Batch1Target = {
  id: number;
  aptName: string;
  focus: string;
};

const BATCH1_TARGETS: Batch1Target[] = [
  { id: 16919, aptName: "해링턴플레이스노원센트럴", focus: "메타/첫문단/내부링크 풀셋" },
  { id: 26429, aptName: "판교밸리제일풍경채", focus: "메타 CTR 개선" },
  { id: 39098, aptName: "동탄역포레너스", focus: "첫문단 숫자 근거 보강" },
  { id: 736, aptName: "파크하비오", focus: "내부링크 10개 이상 보강" },
  { id: 39018, aptName: "힐스테이트동탄", focus: "메타 + 내부링크 동시 개선" },
  { id: 29326, aptName: "매교역푸르지오SKVIEW", focus: "브랜드 키워드 반영" },
  { id: 25319, aptName: "에스케이북한산시티", focus: "지역 키워드 반영" },
  { id: 38832, aptName: "에스케이뷰파크", focus: "첫문단 최신성 문구 반영" },
  { id: 39250, aptName: "동탄역센트럴푸르지오", focus: "메타 길이 최적화" },
  { id: 39185, aptName: "동탄2신도시호반베르디움22단지", focus: "내부링크/관련단지 연결 보강" }
];
const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

function buildComplexTitle(aptName: string): string {
  return `${aptName} 실거래가·시세`;
}

function normalizeDetailTab(raw?: string): DetailTab {
  if (raw === "listings" || raw === "info" || raw === "story") return raw;
  return "price";
}

function formatLatestDealDate(date: string | null): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("ko-KR");
}

function buildComplexSummarySnippet(
  legalDong: string,
  aptName: string,
  latestDealDate: string | null,
  latestDealAmount: number | null,
  dealCount3m: number
): string {
  return `${legalDong} ${aptName} 아파트의 매매·전세·월세 실거래가와 시세를 제공합니다. 최근 거래일은 ${formatLatestDealDate(latestDealDate)}, 최근 거래가는 ${formatManwon(latestDealAmount)}, 최근 3개월 거래량은 ${dealCount3m}건입니다.`;
}

function getBatch1Target(complexId: number): Batch1Target | null {
  return BATCH1_TARGETS.find((item) => item.id === complexId) ?? null;
}

function buildFocusSentence(target: Batch1Target | null): string {
  if (!target) return "";
  return `이번 1차 SEO 반영 대상 단지로, ${target.focus} 작업을 우선 적용합니다.`;
}

function getBatch1RelatedTargets(complexId: number): Batch1Target[] {
  return BATCH1_TARGETS.filter((item) => item.id !== complexId).slice(0, 9);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) return {};

  const complex = await getComplexSummaryById(complexId);
  if (!complex) return {};

  const target = getBatch1Target(complexId);
  const title = `${buildComplexTitle(complex.aptName)} | ${complex.legalDong} 매매·전세·월세`;
  const summarySnippet = buildComplexSummarySnippet(
    complex.legalDong,
    complex.aptName,
    complex.latestDealDate,
    complex.latestDealAmount,
    complex.dealCount3m
  );
  const description = `${summarySnippet}${target ? ` ${buildFocusSentence(target)}` : ""}`;
  const socialTitle = `${buildComplexTitle(complex.aptName)} | ${complex.legalDong} 아파트 | 살집`;

  return {
    title,
    description,
    alternates: { canonical: `https://saljip.kr/complexes/${id}` },
    openGraph: {
      title: socialTitle,
      description,
      url: `https://saljip.kr/complexes/${id}`,
      type: "website",
      siteName: "살집",
      locale: "ko_KR",
      images: [{ url: "https://saljip.kr/og-default.png", width: 1200, height: 630, alt: "살집" }]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["https://saljip.kr/og-default.png"]
    }
  };
}

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function formatKstDateTime(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_TIME_FORMATTER.format(parsed);
}

function formatLocationSourceLabel(source: "exact" | "approx"): string {
  return source === "exact" ? "좌표 품질: 정확" : "좌표 품질: 근사";
}

function sanitizeRegionName(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (/^\d{5}$/.test(value)) return "";
  if (/^지역\s*\d{5}$/.test(value)) return "";
  return value;
}

function formatRegionText(regionName: string | null | undefined, legalDong: string | null | undefined): string {
  const parts = [sanitizeRegionName(regionName), (legalDong ?? "").trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "지역 정보 없음";
}

export default async function ComplexDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = normalizeDetailTab(tab);

  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) notFound();

  const complex = await getComplexSummaryById(complexId);
  if (!complex) notFound();

  const locationQuality = complex.locationQuality ?? complex.locationSource ?? "approx";
  const target = getBatch1Target(complexId);
  const summarySnippet = buildComplexSummarySnippet(
    complex.legalDong,
    complex.aptName,
    complex.latestDealDate,
    complex.latestDealAmount,
    complex.dealCount3m
  );
  const focusSentence = buildFocusSentence(target);
  const relatedTargets = getBatch1RelatedTargets(complexId);

  const deals = activeTab === "price" ? await getComplexDealsById(complexId, 1, 20) : [];

  const tabItems: Array<{ key: DetailTab; label: string }> = [
    { key: "price", label: "시세·실거래" },
    { key: "listings", label: "매물" },
    { key: "info", label: "단지정보" },
    { key: "story", label: "이야기" }
  ];

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 16 }}>
      <Link href="/" style={{ color: "#0f766e", textDecoration: "underline", width: "fit-content" }}>
        뒤로
      </Link>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{complex.aptName}</h1>
        <p style={{ color: "#475569", marginTop: 4 }}>{formatRegionText(complex.regionName, complex.legalDong)}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span className="ui-trust-chip">출처: 국토교통부 실거래가 공개데이터</span>
          <span className="ui-trust-chip">최종 업데이트: {formatKstDateTime(complex.updatedAt)}</span>
          <span className="ui-trust-chip">{formatLocationSourceLabel(locationQuality)}</span>
        </div>
        <p style={{ color: "#64748b", marginTop: 4 }}>데이터 기준일: API 조회 시점 기준</p>
        <p style={{ color: "#0f172a", marginTop: 10, lineHeight: 1.55 }}>{summarySnippet}</p>
        {focusSentence && <p style={{ color: "#334155", marginTop: 8 }}>{focusSentence}</p>}
      </section>

      <DetailActionBar complexId={complexId} />

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}
        aria-label="단지 상세 탭"
      >
        {tabItems.map((item) => {
          const href = item.key === "price" ? `/complexes/${complexId}` : `/complexes/${complexId}?tab=${item.key}`;
          const active = item.key === activeTab;
          return (
            <Link
              key={item.key}
              href={href}
              className="ui-button"
              style={{
                background: active ? "#0f766e" : "#f8fafc",
                color: active ? "#fff" : "#0f172a"
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </section>

      {activeTab === "price" && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래가</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{formatManwon(complex.latestDealAmount)}</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래일</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>
                {complex.latestDealDate ? new Date(complex.latestDealDate).toLocaleDateString("ko-KR") : "-"}
              </p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 3개월 거래</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{complex.dealCount3m}건</p>
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>최근 거래 내역</h2>
            {deals.length === 0 ? (
              <p style={{ color: "#64748b" }}>거래 내역이 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {deals.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: 8
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600 }}>{new Date(d.dealDate).toLocaleDateString("ko-KR")}</p>
                      <p style={{ color: "#64748b" }}>
                        {d.areaM2}m² · {d.floor ?? "-"}층
                      </p>
                    </div>
                    <p style={{ fontWeight: 700 }}>{formatManwon(d.dealAmountManwon)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <FinanceEstimateCard
            complexId={complexId}
            aptName={complex.aptName}
            defaultPriceManwon={complex.latestDealAmount}
            noSnippet
          />

          {relatedTargets.length > 0 && (
            <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>관련 단지 (Batch 1)</h2>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>
                내부링크 강화 대상 단지입니다. 유사 수요/브랜드/권역 비교 탐색에 활용해 주세요.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                {relatedTargets.map((item) => (
                  <Link
                    key={item.id}
                    href={`/complexes/${item.id}`}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 10,
                      textDecoration: "none",
                      color: "inherit"
                    }}
                  >
                    <p style={{ fontWeight: 700 }}>{item.aptName}</p>
                    <p style={{ color: "#64748b", fontSize: 12 }}>{item.focus}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === "listings" && <ComplexListingsTab complexId={complexId} />}

      {activeTab === "info" && (
        <>
          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>단지정보</h2>
            <p style={{ color: "#0f172a" }}>출처: 국토교통부 실거래가 공개데이터</p>
            <p style={{ color: "#64748b", marginTop: 4 }}>기준: API 조회 시점 기준 · {formatLocationSourceLabel(locationQuality)}</p>
          </section>

          <LivabilitySummaryCard
            complexId={complexId}
            title="생활 인프라 요약"
            subtitle={`${formatRegionText(complex.regionName, complex.legalDong)} 기준`}
          />
        </>
      )}

      {activeTab === "story" && (
        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>이야기</h2>
          <p style={{ color: "#64748b" }}>커뮤니티/리뷰 기능은 현재 스코프에서 보류되어 있습니다.</p>
        </section>
      )}
    </main>
  );
}
