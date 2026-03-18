import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DetailActionBar from "@/components/DetailActionBar";
import { getComplexDealsById, getComplexSummaryById } from "@/lib/complexes";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) return {};

  const complex = await getComplexSummaryById(complexId);
  if (!complex) return {};

  const title = `${complex.aptName} 실거래가·시세`;
  const description = `${complex.regionName} ${complex.legalDong} ${complex.aptName} 아파트의 최근 실거래가, 평형별 가격, 거래 요약.`;

  return {
    title,
    description,
    alternates: { canonical: `https://saljip.kr/complexes/${id}` },
    openGraph: {
      title,
      description,
      url: `https://saljip.kr/complexes/${id}`,
      type: "website",
      siteName: "살집",
      locale: "ko_KR",
      images: [{ url: "https://saljip.kr/og-default.png", width: 1200, height: 630, alt: "살집" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
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

export default async function ComplexDetailPage({ params }: PageProps) {
  const { id } = await params;
  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) notFound();

  const complex = await getComplexSummaryById(complexId);
  if (!complex) notFound();

  const deals = await getComplexDealsById(complexId, 1, 20);

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 16 }}>
      <Link href="/" style={{ color: "#0f766e", textDecoration: "underline", width: "fit-content" }}>
        뒤로
      </Link>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{complex.aptName}</h1>
        <p style={{ color: "#475569", marginTop: 4 }}>
          {complex.regionName} {complex.legalDong}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span className="ui-trust-chip">출처: 국토교통부 실거래가 공개데이터</span>
          <span className="ui-trust-chip">최종 업데이트: {formatKstDateTime(complex.updatedAt)}</span>
          <span className="ui-trust-chip">{formatLocationSourceLabel(complex.locationSource)}</span>
        </div>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          데이터 기준일: API 조회 시점 기준
        </p>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>데이터 안내</h2>
        <p style={{ color: "#0f172a" }}>출처: 국토교통부 실거래가 공개데이터</p>
        <p style={{ color: "#64748b", marginTop: 4 }}>기준: API 조회 시점 기준 · {formatLocationSourceLabel(complex.locationSource)}</p>
      </section>

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

      <DetailActionBar complexId={complexId} />
    </main>
  );
}

