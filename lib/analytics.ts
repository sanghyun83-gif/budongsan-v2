"use client";

type EventParams = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  const sanitizedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  gtag("event", eventName, sanitizedParams);
}
