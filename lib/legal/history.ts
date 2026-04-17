import { LEGAL_HISTORY_KEY, LEGAL_HISTORY_LIMIT } from "@/lib/legal/constants";
import type { LegalHistoryItem } from "@/lib/legal/types";

export function readLegalHistory(): LegalHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegalHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLegalHistory(items: LegalHistoryItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEGAL_HISTORY_KEY, JSON.stringify(items.slice(0, LEGAL_HISTORY_LIMIT)));
}

export function appendLegalHistory(item: LegalHistoryItem): LegalHistoryItem[] {
  const current = readLegalHistory();
  const next = [item, ...current].slice(0, LEGAL_HISTORY_LIMIT);
  writeLegalHistory(next);
  return next;
}
