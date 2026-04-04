import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "서울·수도권 아파트 실거래가·시세",
  description:
    "서울·수도권 아파트 매매·전세·월세 실거래가와 시세를 지도에서 검색하세요. 최근 거래일·거래량·가격 요약 제공. 출처: 국토교통부 실거래가 공개데이터.",
  ogDescription:
    "서울·수도권 아파트 매매·전세·월세 실거래가와 시세를 지도에서 검색하세요. 최근 거래일·거래량·가격 요약 제공.",
  path: "/",
});

export default function Home() {
  return <Explorer minimalHome />;
}
