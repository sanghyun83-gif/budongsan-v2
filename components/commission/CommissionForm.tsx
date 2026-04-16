"use client";

import type { DealType, RealEstateType } from "@/lib/commission/types";

type Props = {
  dealType: DealType;
  realEstateType: RealEstateType;
  amount: string;
  rent: string;
  premium: string;
  customRateEnabled: boolean;
  customVatEnabled: boolean;
  customRate: string;
  customVatRate: string;
  onDealType: (v: DealType) => void;
  onRealEstateType: (v: RealEstateType) => void;
  onAmount: (v: string) => void;
  onRent: (v: string) => void;
  onPremium: (v: string) => void;
  onCustomRateEnabled: (v: boolean) => void;
  onCustomVatEnabled: (v: boolean) => void;
  onCustomRate: (v: string) => void;
  onCustomVatRate: (v: string) => void;
  onCalculate: () => void;
};

export default function CommissionForm(props: Props) {
  const amountLabel = props.realEstateType === "distribution" ? "불입금액" : props.dealType === "lease" ? "전세가" : props.dealType === "rent" ? "보증금" : "매매가";

  return (
    <section className="legal-card">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["sale", "lease", "rent"] as DealType[]).map((v) => (
          <button key={v} type="button" className="ui-button" onClick={() => props.onDealType(v)} style={{ background: props.dealType === v ? "#0f766e" : "#e2e8f0", color: props.dealType === v ? "#fff" : "#0f172a" }}>{v === "sale" ? "매매" : v === "lease" ? "전세" : "월세"}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["house", "officetel", "distribution", "etc"] as RealEstateType[]).map((v) => (
          <button key={v} type="button" className="ui-button" onClick={() => props.onRealEstateType(v)} style={{ background: props.realEstateType === v ? "#0f766e" : "#e2e8f0", color: props.realEstateType === v ? "#fff" : "#0f172a" }}>{v === "house" ? "주택" : v === "officetel" ? "오피스텔" : v === "distribution" ? "분양권" : "그 외"}</button>
        ))}
      </div>

      <div className="explorer-filter-grid">
        <label className="hub-finance-field"><span>{amountLabel}(만원)</span><input id="commission-react-amount" className="ui-input" value={props.amount} onChange={(e) => props.onAmount(e.target.value)} /></label>
        {props.dealType === "rent" && <label className="hub-finance-field"><span>월세(만원)</span><input id="commission-react-rent" className="ui-input" value={props.rent} onChange={(e) => props.onRent(e.target.value)} /></label>}
        {props.realEstateType === "distribution" && <label className="hub-finance-field"><span>프리미엄(만원)</span><input id="commission-react-premium" className="ui-input" value={props.premium} onChange={(e) => props.onPremium(e.target.value)} /></label>}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label><input id="commission-react-custom-rate-enabled" type="checkbox" checked={props.customRateEnabled} onChange={(e) => props.onCustomRateEnabled(e.target.checked)} /> 요율 직접 입력</label>
        {props.customRateEnabled && <input id="commission-react-custom-rate" className="ui-input" style={{ width: 120 }} value={props.customRate} onChange={(e) => props.onCustomRate(e.target.value)} placeholder="요율 %" />}
        <label><input id="commission-react-custom-vat-enabled" type="checkbox" checked={props.customVatEnabled} onChange={(e) => props.onCustomVatEnabled(e.target.checked)} /> 부가세율 직접 입력</label>
        {props.customVatEnabled && <input id="commission-react-custom-vat" className="ui-input" style={{ width: 120 }} value={props.customVatRate} onChange={(e) => props.onCustomVatRate(e.target.value)} placeholder="부가세율 %" />}
      </div>

      <button id="commission-react-submit" type="button" className="ui-button" onClick={props.onCalculate}>중개보수 계산</button>
    </section>
  );
}
