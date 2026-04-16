const FAQ = [
  {
    q: "중개보수(중개수수료)와 복비는 같은 의미인가요?",
    a: "일상적으로 같은 의미로 사용됩니다. 법령에서는 중개보수라는 표현을 주로 사용합니다.",
  },
  {
    q: "요율표의 숫자는 반드시 그대로 받아야 하나요?",
    a: "요율표는 상한선입니다. 상한선 이하에서 협의할 수 있습니다.",
  },
  {
    q: "월세 계약에서 거래금액은 왜 환산하나요?",
    a: "보증금과 월세를 함께 반영하기 위해 환산식(보증금 + 월세×100)을 사용합니다.",
  },
  {
    q: "분양권은 어떤 금액을 넣어야 하나요?",
    a: "거래 당시까지의 불입금액과 프리미엄을 각각 입력하면 자동 합산됩니다.",
  },
];

export default function CommissionFaq() {
  return (
    <section className="legal-card">
      <h2 style={{ fontWeight: 800, fontSize: 20 }}>자주 묻는 질문</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {FAQ.map((item) => (
          <details key={item.q} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{item.q}</summary>
            <p style={{ marginTop: 8, color: "#334155", lineHeight: 1.6 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
