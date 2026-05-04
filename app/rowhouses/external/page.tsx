import { permanentRedirect } from "next/navigation";
import { encodeRouteParams, makeStableKey, propertyTypeToCode } from "@/lib/url-key";

type SearchParams = Promise<{ kind?: string; sggCd?: string; umdNm?: string; name?: string; jibun?: string }>;

export default async function ExternalRowhousePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const propertyType = params.kind === "officetel" ? "officetel" : "dasaedae";
  const sggCd = (params.sggCd ?? "").trim() || "00000";
  const umdNm = (params.umdNm ?? "").trim();
  const jibun = (params.jibun ?? "").trim();
  const complexName = (params.name ?? "").trim();

  if (!complexName) {
    return null;
  }

  const stableKey = makeStableKey({ propertyType, complexName, sggCd, umdNm, jibun });
  const token = encodeRouteParams(
    { propertyType, complexName, sggCd, umdNm, jibun },
    process.env.URL_SIGNING_SECRET
  );
  const ptypeCode = propertyTypeToCode(propertyType);
  permanentRedirect(`/deallist/${encodeURIComponent(sggCd)}/${ptypeCode}/${stableKey}?t=${encodeURIComponent(token)}`);
}
