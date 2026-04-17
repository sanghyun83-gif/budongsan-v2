import type { Metadata } from "next";
import LegalPageClient from "@/app/legal/LegalPageClient";
import LegalSeoJsonLd from "@/components/legal/LegalSeoJsonLd";
import { getActiveLegalSeoTitle } from "@/lib/legal/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

const legalSeoTitle = getActiveLegalSeoTitle();

export const metadata: Metadata = buildPageMetadata({
  title: legalSeoTitle,
  description:
    "법무사 보수 계산기에서 과세표준·기재금액 기준 보수, 부가세, 인지·증지 비용을 빠르게 확인하세요. 등기 진행 전 정책자료 요약과 실무 체크포인트도 함께 제공합니다.",
  ogDescription:
    "등기 전 필수 확인: 법무사 보수·부가세·인지·증지 비용 계산 + 보수기준 정책자료 요약 제공",
  path: "/legal",
});

export default function LegalPageRoute() {
  // 운영 시 LEGAL_SEO_VARIANT=A|B|C 로 타이틀 A/B/C 테스트 가능
  return (
    <>
      <LegalSeoJsonLd />
      <LegalPageClient />
    </>
  );
}
