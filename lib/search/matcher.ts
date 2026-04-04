const NON_SEARCH_CHARS = /[^0-9a-zA-Z가-힣]/g;
const MULTI_SPACE = /\s+/g;

type AliasGroup = {
  variants: string[];
};

const ALIAS_GROUPS: AliasGroup[] = [
  { variants: ["아이파크", "ipark"] },
  { variants: ["e편한세상", "e편한", "epeonhan"] },
  { variants: ["더샵", "thesharp"] },
  { variants: ["자이", "xi"] },
  { variants: ["래미안", "raemian"] },
  { variants: ["롯데캐슬", "lottecastle"] }
];

function normalize(raw: string): string {
  return raw.toLowerCase().replace(NON_SEARCH_CHARS, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v.length > 0)));
}

export type SearchMatcher = {
  qLike: string;
  qExact: string;
  qNormLike: string | null;
  patternTerms: string[] | null;
  andTokens: string[] | null;
};

export function buildSearchMatcher(query: string): SearchMatcher {
  const qExact = query.trim();
  const qLike = `%${qExact}%`;
  const qNorm = normalize(qExact);

  const patternTerms: string[] = [];
  const andTokens: string[] = [];

  if (qNorm.length > 0) {
    patternTerms.push(qNorm);
    const splitTokens = qExact
      .split(MULTI_SPACE)
      .map((token) => normalize(token))
      .filter((token) => token.length >= 2);
    andTokens.push(...splitTokens);

    for (const group of ALIAS_GROUPS) {
      for (const variant of group.variants) {
        const normalizedVariant = normalize(variant);
        if (!normalizedVariant || !qNorm.includes(normalizedVariant)) continue;

        for (const replacement of group.variants) {
          const normalizedReplacement = normalize(replacement);
          if (!normalizedReplacement) continue;
          patternTerms.push(qNorm.replace(normalizedVariant, normalizedReplacement));
        }

        const leftOvers = qNorm
          .split(normalizedVariant)
          .map((chunk) => chunk.trim())
          .filter((chunk) => chunk.length >= 2);

        // 띄어쓰기/순서가 달라도 브랜드+지역 핵심 토큰이 모두 포함되도록 강제
        andTokens.push(normalizedVariant);
        andTokens.push(...leftOvers);
      }
    }
  }

  return {
    qLike,
    qExact,
    qNormLike: qNorm.length > 0 ? `%${qNorm}%` : null,
    patternTerms: patternTerms.length > 0 ? unique(patternTerms) : null,
    andTokens: andTokens.length > 0 ? unique(andTokens) : null
  };
}

