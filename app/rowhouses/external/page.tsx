import Link from "next/link";

type SearchParams = Promise<{ kind?: string; sggCd?: string; umdNm?: string; name?: string }>;

export default async function ExternalRowhousePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const kind = params.kind === "officetel" ? "officetel" : "villa";
  const sggCd = (params.sggCd ?? "").trim();
  const umdNm = (params.umdNm ?? "").trim();
  const name = (params.name ?? "").trim();

  if (!sggCd || !name) {
    return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 요청입니다.</main>;
  }

  const apiKey = process.env.SOOTJA_API_KEY ?? process.env.API_KEY;
  const base = process.env.SOOTJA_API_BASE_URL ?? "https://sootja.kr/api";
  if (!apiKey) {
    return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>SOOTJA API 키가 필요합니다.</main>;
  }

  const propertyType = kind === "villa" ? "dasaedae" : "officetel";
  const sp = new URLSearchParams({
    api_key: apiKey,
    property_type: propertyType,
    complex_name: name,
    page: "1",
    page_size: "50"
  });
  if (sggCd) sp.set("sggCd", sggCd);
  if (umdNm) sp.set("umdNm", umdNm);

  const res = await fetch(`${base}/v1/complex/records?${sp.toString()}`, { cache: "no-store" });
  const json = res.ok ? await res.json() : {};
  const tradeBlock = json?.trade;
  const items = Array.isArray(tradeBlock?.items) ? tradeBlock.items : [];

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 16, display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>{name}</h1>
      <p style={{ color: "#64748b" }}>{kind === "villa" ? "빌라" : "오피스텔"} · {sggCd} {umdNm}</p>
      <Link href={`/search?q=${encodeURIComponent(name.replace(/\d+동$/, ""))}`} style={{ color: "#0f766e" }}>← 검색으로 돌아가기</Link>
      {items.slice(0, 20).map((row: Record<string, string>, idx: number) => (
        <div key={`${row.dealyear}-${row.dealmonth}-${row.dealday}-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
          <div style={{ fontWeight: 700 }}>{row.dealamount ?? "-"}만원</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{row.dealyear}.{row.dealmonth}.{row.dealday} · {row.excluusear ?? "-"}㎡</div>
        </div>
      ))}
      {items.length === 0 ? <div style={{ color: "#64748b" }}>거래 데이터가 없습니다.</div> : null}
    </main>
  );
}
