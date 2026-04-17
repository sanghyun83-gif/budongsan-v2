"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateLegalCommission } from "@/lib/legal/calc";
import { DEFAULT_AMOUNT_MANWON, DEFAULT_STAMP_AMOUNT_MANWON } from "@/lib/legal/constants";
import { exportLegalAsImage } from "@/lib/legal/export-image";
import { exportLegalAsPdf } from "@/lib/legal/export-pdf";
import { buildLegalShareUrl, parseLegalShareQuery } from "@/lib/legal/share";
import type { LegalInput, LegalResultRow, RealEstateType } from "@/lib/legal/types";
import { validateLegalInput } from "@/lib/legal/validator";

type CalcMode = "replace" | "add";
type BusyType = "" | "image" | "pdf";

type SaveFeedback = {
  tone: "success" | "error" | "info";
  message: string;
  help?: string;
} | null;

type LegalInputSnapshot = {
  realEstateType: RealEstateType;
  amount: string;
  stampAmount: string;
  publicCost: boolean;
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLegalCalculator() {
  const [realEstateType, setRealEstateType] = useState<RealEstateType>("house");
  const [amount, setAmount] = useState(String(DEFAULT_AMOUNT_MANWON));
  const [stampAmount, setStampAmount] = useState(String(DEFAULT_STAMP_AMOUNT_MANWON));
  const [publicCost, setPublicCost] = useState(false);
  const [showNumber, setShowNumber] = useState(true);
  const [error, setError] = useState("");
  const [basisText, setBasisText] = useState("");
  const [busy, setBusy] = useState<BusyType>("");
  const [results, setResults] = useState<LegalResultRow[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null);

  const initialSnapshotRef = useRef<LegalInputSnapshot>({
    realEstateType: "house",
    amount: String(DEFAULT_AMOUNT_MANWON),
    stampAmount: String(DEFAULT_STAMP_AMOUNT_MANWON),
    publicCost: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const parsed = parseLegalShareQuery(window.location.search);
    const initialSnapshot: LegalInputSnapshot = {
      realEstateType: parsed.realEstateType ?? "house",
      amount: parsed.amountManwon ? String(parsed.amountManwon) : String(DEFAULT_AMOUNT_MANWON),
      stampAmount: parsed.stampAmountManwon ? String(parsed.stampAmountManwon) : String(DEFAULT_STAMP_AMOUNT_MANWON),
      publicCost: typeof parsed.includePublicCost === "boolean" ? parsed.includePublicCost : false,
    };

    initialSnapshotRef.current = initialSnapshot;
    setRealEstateType(initialSnapshot.realEstateType);
    setAmount(initialSnapshot.amount);
    setStampAmount(initialSnapshot.stampAmount);
    setPublicCost(initialSnapshot.publicCost);
  }, []);

  const input = useMemo<LegalInput>(
    () => ({
      realEstateType,
      amountManwon: Number(amount || 0),
      stampAmountManwon: Number(stampAmount || 0),
      includePublicCost: publicCost,
    }),
    [realEstateType, amount, stampAmount, publicCost]
  );

  const setHouse = () => setRealEstateType("house");
  const setBuilding = () => setRealEstateType("building");
  const toggleNumber = () => setShowNumber((prev) => !prev);

  const isDirty =
    realEstateType !== initialSnapshotRef.current.realEstateType ||
    amount !== initialSnapshotRef.current.amount ||
    stampAmount !== initialSnapshotRef.current.stampAmount ||
    publicCost !== initialSnapshotRef.current.publicCost ||
    results.length > 0;

  const focusField = (id: string) => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) return;
      el.focus();
      el.select?.();
    }, 0);
  };

  const onResetToInitial = () => {
    if (results.length > 0) {
      const ok = window.confirm("현재 계산 결과를 초기 상태로 되돌릴까요?");
      if (!ok) return;
    }

    const base = initialSnapshotRef.current;
    setRealEstateType(base.realEstateType);
    setAmount(base.amount);
    setStampAmount(base.stampAmount);
    setPublicCost(base.publicCost);
    setResults([]);
    setBasisText("");
    setError("");
    setSaveFeedback(null);
    setShowNumber(true);
  };

  const onCalculate = (mode: CalcMode) => {
    const validationError = validateLegalInput(input);
    if (validationError) {
      setError(validationError);
      if (validationError.includes("과세표준")) focusField("amount");
      if (validationError.includes("기재금액")) focusField("stampAmount");
      return;
    }

    setError("");
    const calc = calculateLegalCommission(input);
    setBasisText(calc.basisText);

    setResults((prev) => {
      const nextSeq = mode === "add" ? prev.length + 1 : 1;
      const row: LegalResultRow = {
        id: makeId(),
        seq: nextSeq,
        amountWon: input.amountManwon * 10_000,
        basicFeeWon: calc.basicFeeWon,
        progressiveAddWon: calc.progressiveAddWon,
        typeAdjustmentWon: calc.typeAdjustmentWon,
        feeBeforeVatWon: calc.feeBeforeVatWon,
        feeCapWon: calc.feeCapWon,
        feeWon: calc.feeWon,
        vatWon: calc.vatWon,
        stampDutyWon: calc.publicCostBreakdown.stampDutyWon,
        localStampWon: calc.publicCostBreakdown.localStampWon,
        certificateWon: calc.publicCostBreakdown.certificateWon,
        publicCostWon: calc.publicCostWon,
        totalWon: calc.totalWon,
      };

      return mode === "add" ? [...prev, row] : [row];
    });
  };

  const onCopyUrl = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert("복사되었습니다!");
    } catch {
      window.prompt("아래 주소를 복사하세요", window.location.href);
    }
  };

  const onShareLink = async () => {
    if (typeof window === "undefined") return;
    const url = buildLegalShareUrl(input);
    try {
      await navigator.clipboard.writeText(url);
      setSaveFeedback({ tone: "success", message: "공유 링크를 클립보드에 복사했습니다." });
    } catch {
      setSaveFeedback({
        tone: "info",
        message: "클립보드 복사 권한이 없어 링크를 직접 표시합니다.",
        help: url,
      });
    }
  };

  const onSaveImage = async () => {
    try {
      setBusy("image");
      await exportLegalAsImage("main");
      setSaveFeedback({ tone: "success", message: "이미지 파일 저장을 시작했습니다." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "이미지 저장 중 오류가 발생했습니다.";
      setSaveFeedback({
        tone: "error",
        message,
        help: "브라우저 다운로드 차단 여부를 확인한 뒤 다시 시도하세요.",
      });
    } finally {
      setBusy("");
    }
  };

  const onSavePdf = async () => {
    try {
      setBusy("pdf");
      await exportLegalAsPdf("main");
      setSaveFeedback({ tone: "success", message: "PDF 파일 저장을 시작했습니다." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "PDF 저장 중 오류가 발생했습니다.";
      setSaveFeedback({
        tone: "error",
        message,
        help: "브라우저 팝업/다운로드 차단 설정을 확인해 주세요.",
      });
    } finally {
      setBusy("");
    }
  };

  const clearSaveFeedback = () => setSaveFeedback(null);

  return {
    realEstateType,
    amount,
    stampAmount,
    publicCost,
    showNumber,
    results,
    basisText,
    error,
    busy,
    saveFeedback,
    setHouse,
    setBuilding,
    setAmount,
    setStampAmount,
    setPublicCost,
    toggleNumber,
    onCalculate,
    isDirty,
    onResetToInitial,
    onCopyUrl,
    onShareLink,
    onSaveImage,
    onSavePdf,
    clearSaveFeedback,
  };
}
