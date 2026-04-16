const baseUrl = process.env.QA_BASE_URL || process.argv[2] || "http://localhost:3000";

const checks = [
  { name: "commission_page", path: "/commission", expect: 200 },
  { name: "commission_api", path: "/api/commission/calc", method: "POST", expect: 200, body: { dealType: "sale", realEstateType: "house", amountManwon: 100000, vatRatePct: 10 } },
  { name: "commission_mock", path: "/mock/commission", expect: 200 },
];

let pass = 0;
for (const check of checks) {
  const opts = { method: check.method || "GET", headers: {} };
  if (check.body) {
    opts.headers["content-type"] = "application/json";
    opts.body = JSON.stringify(check.body);
  }

  try {
    const res = await fetch(`${baseUrl}${check.path}`, opts);
    const ok = res.status === check.expect;
    if (ok) pass += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${check.name} expect=${check.expect} got=${res.status}`);
  } catch (e) {
    console.log(`FAIL ${check.name} error=${e instanceof Error ? e.message : String(e)}`);
  }
}

if (pass !== checks.length) process.exit(1);
