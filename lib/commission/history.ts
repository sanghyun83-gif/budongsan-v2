import type { CommissionInput, CommissionResult } from "@/lib/commission/types";

export type CommissionHistoryItem = {
  id: string;
  createdAt: string;
  input: CommissionInput;
  result: CommissionResult;
};

const STORAGE_KEY = "saljip:commission:history:v1";

export function readCommissionHistory(): CommissionHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommissionHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCommissionHistory(items: CommissionHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
}

export function appendCommissionHistory(input: CommissionInput, result: CommissionResult) {
  const current = readCommissionHistory();
  const next: CommissionHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    input,
    result,
  };
  writeCommissionHistory([next, ...current]);
  return next;
}
