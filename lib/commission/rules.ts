import type { RateRule } from "@/lib/commission/types";

export const HOUSE_SALE_RULES: RateRule[] = [
  { maxExclusive: 5000, rate: 0.006, limitManwon: 25, label: "5천만원 미만" },
  { maxExclusive: 20000, rate: 0.005, limitManwon: 80, label: "5천만원 이상~2억원 미만" },
  { maxExclusive: 90000, rate: 0.004, limitManwon: null, label: "2억원 이상~9억원 미만" },
  { maxExclusive: 120000, rate: 0.005, limitManwon: null, label: "9억원 이상~12억원 미만" },
  { maxExclusive: 150000, rate: 0.006, limitManwon: null, label: "12억원 이상~15억원 미만" },
  { maxExclusive: null, rate: 0.007, limitManwon: null, label: "15억원 이상" }
];

export const HOUSE_LEASE_RULES: RateRule[] = [
  { maxExclusive: 5000, rate: 0.005, limitManwon: 20, label: "5천만원 미만" },
  { maxExclusive: 10000, rate: 0.004, limitManwon: 30, label: "5천만원 이상~1억원 미만" },
  { maxExclusive: 60000, rate: 0.003, limitManwon: null, label: "1억원 이상~6억원 미만" },
  { maxExclusive: 120000, rate: 0.004, limitManwon: null, label: "6억원 이상~12억원 미만" },
  { maxExclusive: 150000, rate: 0.005, limitManwon: null, label: "12억원 이상~15억원 미만" },
  { maxExclusive: null, rate: 0.006, limitManwon: null, label: "15억원 이상" }
];

export const OFFICETEL_SALE_RATE = 0.005;
export const OFFICETEL_LEASE_RATE = 0.004;
export const ETC_MAX_RATE = 0.009;
export const DEFAULT_VAT_RATE = 0.1;
