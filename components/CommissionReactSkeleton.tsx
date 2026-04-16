"use client";

import { useMemo, useState } from "react";
import { calculateCommission, type DealType, type RealEstateType } from "@/lib/commission/calc";

function formatMoneyManwon(value: number) {
  return `${Math.round(value * 100) / 100}만원`;
}

export default function CommissionReactSkeleton() {
  const [dealType, setDealType] = useState<DealType>("sale");
  const [estateType, setEstateType] = useState<RealEstateType>("house");
  const [amount, setAmount] = useState("100000");
  const [rent, setRent] = useState("");
  const [premium, setPremium] = useState("");
  const [customRateEnabled, setCustomRateEnabled] = useState(false);
  const [customVatEnabled, setCustomVatEnabled] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [customVatRate, setCustomVatRate] = useState("10");
  const [submitted, setSubmitted] = useState(false);

  const amountLabel = useMemo(() => {
    if (estateType === "distribution") return "불입금액";
    if (dealType === "lease") return "전세가";
    if (dealType === "rent") return "보증금";
    return "매매가";
  }, [dealType, estateType]);

  const result = useMemo(() => {
    if (!submitted) return null;
    const amountNum = Number(amount || 0);
    if (!amountNum || Number.isNaN(amountNum) || amountNum <= 0) return null;

    return calculateCommission({
      dealType,
      realEstateType: estateType,
      amountManwon: amountNum,
      rentManwon: Number(rent || 0),
      premiumManwon: Number(premium || 0),
      customRatePct: customRateEnabled ? Number(customRate || 0) : null,
      vatRatePct: customVatEnabled ? Number(customVatRate || 0) : 10
    });
  }, [submitted, amount, dealType, estateType, rent, premium, customRateEnabled, customRate, customVatEnabled, customVatRate]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>중개보수 React 전환(5차)</h1>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff", display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["sale", "lease", "rent"] as DealType[]).map((type) => (
            <button
              key={type}
              type="button"
              className="ui-button"
              onClick={() => {
                setDealType(type);
                setSubmitted(false);
              }}
              style={{ background: dealType === type ? "#0f766e" : "#e2e8f0", color: dealType === type ? "#fff" : "#0f172a" }}
            >
              {type === "sale" ? "매매계약" : type === "lease" ? "전세계약" : "월세계약"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["house", "officetel", "distribution", "etc"] as RealEstateType[]).map((type) => (
            <button
              key={type}
              type="button"
              className="ui-button"
              onClick={() => {
                setEstateType(type);
                setSubmitted(false);
              }}
              style={{ background: estateType === type ? "#0f766e" : "#e2e8f0", color: estateType === type ? "#fff" : "#0f172a" }}
            >
              {type === "house" ? "주택" : type === "officetel" ? "오피스텔" : type === "distribution" ? "분양권" : "그 외"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{amountLabel}</span>
            <input id="commission-react-amount" className="ui-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액 입력(만원)" />
          </label>

          {dealType === "rent" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>월세</span>
              <input id="commission-react-rent" className="ui-input" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="월세 입력(만원)" />
            </label>
          )}

          {estateType === "distribution" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>프리미엄</span>
              <input id="commission-react-premium" className="ui-input" value={premium} onChange={(e) => setPremium(e.target.value)} placeholder="프리미엄 입력(만원)" />
            </label>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#334155" }}>
            <input id="commission-react-custom-rate-enabled" type="checkbox" checked={customRateEnabled} onChange={(e) => setCustomRateEnabled(e.target.checked)} /> 요율 직접 입력
          </label>
          {customRateEnabled && (
            <input id="commission-react-custom-rate" className="ui-input" style={{ maxWidth: 120 }} value={customRate} onChange={(e) => setCustomRate(e.target.value)} placeholder="요율(%)" />
          )}

          <label style={{ fontSize: 13, color: "#334155" }}>
            <input id="commission-react-custom-vat-enabled" type="checkbox" checked={customVatEnabled} onChange={(e) => setCustomVatEnabled(e.target.checked)} /> 부가세율 직접 입력
          </label>
          {customVatEnabled && (
            <input id="commission-react-custom-vat" className="ui-input" style={{ maxWidth: 120 }} value={customVatRate} onChange={(e) => setCustomVatRate(e.target.value)} placeholder="부가세율(%)" />
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button id="commission-react-submit" type="button" className="ui-button" onClick={() => setSubmitted(true)}>
            중개보수 계산
          </button>
        </div>
      </section>

      {submitted && !result && <div className="ui-error">입력값을 확인해주세요. 거래금액은 0보다 커야 합니다.</div>}

      {result && (
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 12, display: "grid", gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>계산 결과</h2>
          <div className="legal-table-wrap">
            <table className="legal-table" style={{ minWidth: 520 }}>
              <tbody>
                <tr>
                  <th>거래금액(기준)</th>
                  <td>{formatMoneyManwon(result.transactionAmountManwon)}</td>
                </tr>
                <tr>
                  <th>적용 요율</th>
                  <td>{result.rateLabel}</td>
                </tr>
                <tr>
                  <th>상한 한도액</th>
                  <td>{result.upperLimitManwon === null ? "없음" : formatMoneyManwon(result.upperLimitManwon)}</td>
                </tr>
                <tr>
                  <th>중개보수</th>
                  <td>{formatMoneyManwon(result.commissionManwon)}</td>
                </tr>
                <tr>
                  <th>부가세</th>
                  <td>
                    {formatMoneyManwon(result.vatManwon)} ({(result.vatRate * 100).toFixed(1)}%)
                  </td>
                </tr>
                <tr>
                  <th>합계</th>
                  <td id="commission-react-total" style={{ fontWeight: 800 }}>{formatMoneyManwon(result.totalManwon)}</td>
                </tr>
                <tr>
                  <th>계산 기준</th>
                  <td>{result.basisText}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="legal-meta">※ 서울 기준 표준 상한요율 기반. 월세는 보증금 + (월세×100) 기준으로 환산했습니다.</p>
        </section>
      )}
    </main>
  );
}
