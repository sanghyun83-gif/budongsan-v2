export default function CommissionBasis({ basis }: { basis: string }) {
  return (
    <section className="legal-card" aria-live="polite">
      <h3 style={{ fontWeight: 800 }}>계산 근거</h3>
      <p style={{ color: "#334155" }}>{basis}</p>
    </section>
  );
}
