type FaqItem = { question: string; answer: string };

const FAQ_ITEMS: FaqItem[] = [
  { question: "중개보수는 법으로 고정된 금액인가요?", answer: "요율표의 값은 상한선이며 상한 범위 내에서 중개사와 협의할 수 있습니다." },
  { question: "부가세는 별도로 계산되나요?", answer: "기본 예시는 부가세 10%를 적용하며 필요 시 부가세율을 직접 입력할 수 있습니다." },
  { question: "월세 계약은 어떻게 환산하나요?", answer: "이 계산기는 보증금 + (월세 × 100) 기준으로 거래금액을 환산합니다." },
  { question: "분양권 계산은 어떻게 하나요?", answer: "분양권은 불입금액 + 프리미엄을 기준금액으로 계산합니다." },
];

export default function CommissionSeoJsonLd() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://saljip.kr/" },
      { "@type": "ListItem", position: 2, name: "중개보수 계산기", item: "https://saljip.kr/commission" },
    ],
  };

  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "살집 중개보수 계산기",
    url: "https://saljip.kr/commission",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }} />
    </>
  );
}
