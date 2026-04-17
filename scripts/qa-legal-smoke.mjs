const base = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  const res = await fetch(`${base}/legal`);
  if (!res.ok) throw new Error(`/legal 응답 실패: ${res.status}`);
  const html = await res.text();
  if (!html.includes("법무사 보수 계산")) throw new Error("핵심 문구 누락");
  console.log("[qa-legal-smoke] PASS");
}

run().catch((err) => {
  console.error("[qa-legal-smoke] FAIL", err);
  process.exit(1);
});
