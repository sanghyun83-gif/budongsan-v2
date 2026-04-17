import { LEGAL_FAQ_ITEMS } from "@/components/legal/legalFaqData";

export default function LegalFaq() {
  return (
    <section className="legal-card">
      <h3 style={{ fontWeight: 800 }}>자주 묻는 질문</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {LEGAL_FAQ_ITEMS.map((item) => (
          <details key={item.q} className="legal-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
