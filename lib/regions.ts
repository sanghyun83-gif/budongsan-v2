import type { Sigungu } from "@/lib/types";

export const SIGUNGU_LIST: Sigungu[] = [
  { code: "11680", sido: "seoul", slug: "gangnam", nameKo: "강남구" },
  { code: "11650", sido: "seoul", slug: "seocho", nameKo: "서초구" },
  { code: "11710", sido: "seoul", slug: "songpa", nameKo: "송파구" },
  { code: "41135", sido: "gyeonggi", slug: "bundang", nameKo: "성남시 분당구" },
  { code: "41465", sido: "gyeonggi", slug: "suji", nameKo: "용인시 수지구" }
];

export const DEFAULT_REGION_CODES = SIGUNGU_LIST.map((r) => r.code);

export function getSigunguByCode(code: string): Sigungu | undefined {
  return SIGUNGU_LIST.find((r) => r.code === code);
}

