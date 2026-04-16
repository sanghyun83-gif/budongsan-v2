"use client";

import { useMemo, useState } from "react";
import CommissionForm from "@/components/commission/CommissionForm";
import CommissionResultSummary from "@/components/commission/CommissionResultSummary";
import CommissionResultTable from "@/components/commission/CommissionResultTable";
import CommissionBasis from "@/components/commission/CommissionBasis";
import CommissionHistory from "@/components/commission/CommissionHistory";
import CommissionShare from "@/components/commission/CommissionShare";
import CommissionIntroTabs from "@/components/commission/CommissionIntroTabs";
import CommissionRateTable from "@/components/commission/CommissionRateTable";
import CommissionFaq from "@/components/commission/CommissionFaq";
import CommissionArticle from "@/components/commission/CommissionArticle";
import CommissionLegalNotice from "@/components/commission/CommissionLegalNotice";
import { appendCommissionHistory, readCommissionHistory, writeCommissionHistory, type CommissionHistoryItem } from "@/lib/commission/history";
import { buildCommissionShareQuery } from "@/lib/commission/share";
import { calculateCommission, type DealType, type RealEstateType } from "@/lib/commission/calc";

export default function CommissionPage() {
  const [dealType, setDealType] = useState<DealType>("sale");
  const [realEstateType, setRealEstateType] = useState<RealEstateType>("house");
  const [amount, setAmount] = useState("100000");
  const [rent, setRent] = useState("");
  const [premium, setPremium] = useState("");
  const [customRateEnabled, setCustomRateEnabled] = useState(false);
  const [customVatEnabled, setCustomVatEnabled] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [customVatRate, setCustomVatRate] = useState("10");
  const [result, setResult] = useState<ReturnType<typeof calculateCommission> | null>(null);
  const [history, setHistory] = useState<CommissionHistoryItem[]>(() => readCommissionHistory());

  const input = useMemo(
    () => ({
      dealType,
      realEstateType,
      amountManwon: Number(amount || 0),
      rentManwon: Number(rent || 0),
      premiumManwon: Number(premium || 0),
      customRatePct: customRateEnabled ? Number(customRate || 0) : null,
      vatRatePct: customVatEnabled ? Number(customVatRate || 0) : 10,
    }),
    [dealType, realEstateType, amount, rent, premium, customRateEnabled, customRate, customVatEnabled, customVatRate]
  );

  const shareQuery = useMemo(() => buildCommissionShareQuery(input), [input]);

  const onCalculate = () => {
    if (!input.amountManwon || input.amountManwon <= 0) {
      alert("거래금액을 입력하세요.");
      return;
    }
    const next = calculateCommission(input);
    setResult(next);
    try {
      appendCommissionHistory(input, next);
      setHistory(readCommissionHistory());
    } catch {
      // ignore storage errors
    }
  };

  const onSelectHistory = (item: CommissionHistoryItem) => {
    setDealType(item.input.dealType);
    setRealEstateType(item.input.realEstateType);
    setAmount(String(item.input.amountManwon ?? 0));
    setRent(String(item.input.rentManwon ?? 0));
    setPremium(String(item.input.premiumManwon ?? 0));
    if (item.input.customRatePct !== null && item.input.customRatePct !== undefined) {
      setCustomRateEnabled(true);
      setCustomRate(String(item.input.customRatePct));
    } else {
      setCustomRateEnabled(false);
      setCustomRate("");
    }
    setCustomVatEnabled(true);
    setCustomVatRate(String(item.input.vatRatePct ?? 10));
    setResult(item.result);
  };

  return (
    <main className="legal-page" style={{ maxWidth: 1160 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>중개보수 계산기</h1>
      <p className="legal-meta">매매·전세·월세, 오피스텔/분양권 포함 중개보수와 부가세를 빠르게 계산하세요.</p>

      <div className="explorer-grid">
        <div style={{ display: "grid", gap: 10 }}>
          <CommissionIntroTabs />
          <CommissionForm
            dealType={dealType}
            realEstateType={realEstateType}
            amount={amount}
            rent={rent}
            premium={premium}
            customRateEnabled={customRateEnabled}
            customVatEnabled={customVatEnabled}
            customRate={customRate}
            customVatRate={customVatRate}
            onDealType={setDealType}
            onRealEstateType={setRealEstateType}
            onAmount={setAmount}
            onRent={setRent}
            onPremium={setPremium}
            onCustomRateEnabled={setCustomRateEnabled}
            onCustomVatEnabled={setCustomVatEnabled}
            onCustomRate={setCustomRate}
            onCustomVatRate={setCustomVatRate}
            onCalculate={onCalculate}
          />
          <CommissionHistory
            items={history}
            onSelect={onSelectHistory}
            onClear={() => {
              writeCommissionHistory([]);
              setHistory([]);
            }}
          />
          <CommissionRateTable />
          <CommissionFaq />
          <CommissionArticle />
          <CommissionLegalNotice />
        </div>

        <aside style={{ display: "grid", gap: 10, alignContent: "start" }}>
          {result ? (
            <>
              <CommissionResultSummary result={result} />
              <CommissionResultTable result={result} />
              <CommissionBasis basis={result.basisText} />
              <CommissionShare query={shareQuery} />
            </>
          ) : (
            <section className="legal-card">
              <h3 style={{ fontWeight: 800 }}>계산 결과</h3>
              <p className="legal-meta">좌측 입력값을 설정하고 중개보수 계산 버튼을 눌러주세요.</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
