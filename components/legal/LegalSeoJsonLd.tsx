import { LEGAL_FAQ_ITEMS } from "@/components/legal/legalFaqData";

export default function LegalSeoJsonLd() {
  const canonical = "https://saljip.kr/legal";

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "법무사 보수 계산기",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: canonical,
    inLanguage: "ko-KR",
    description:
      "과세표준·기재금액을 입력해 법무사 보수, 부가세, 인지·증지 비용을 계산하고 정책자료를 함께 확인할 수 있는 계산기",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://saljip.kr/" },
      { "@type": "ListItem", position: 2, name: "법무사 보수 계산기", item: canonical },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "법무사 보수기준 요약 및 등기비용 계산 가이드",
    datePublished: "2024-09-12",
    dateModified: "2024-09-12",
    author: { "@type": "Person", name: "관리자" },
    mainEntityOfPage: canonical,
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LEGAL_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
