import type { Metadata } from "next";
import CommissionPage from "@/components/commission/CommissionPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "중개보수 계산기(복비) | 매매·전세·월세 자동 계산",
  description:
    "중개보수(중개수수료·복비)를 매매·전세·월세 기준으로 자동 계산하세요. 주택·오피스텔·분양권 지원, 한도액·부가세 포함 결과 제공.",
  ogDescription:
    "중개보수(중개수수료·복비)를 매매·전세·월세 기준으로 자동 계산하세요. 주택·오피스텔·분양권 지원.",
  path: "/commission",
});

export default function CommissionPageRoute() {
  return <CommissionPage />;
}
