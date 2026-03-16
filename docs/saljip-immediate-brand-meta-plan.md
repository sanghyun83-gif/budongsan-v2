# saljip.kr Immediate Brand/Meta Baseline Plan

## 목표
- 프로젝트 표기를 `budongsan-v2`에서 `saljip.kr` + 브랜드명 `살집`으로 즉시 교체
- 파비콘 및 기본 메타 태그를 정리해 신뢰도와 공유 노출 개선
- 기반공사(P0 데이터 커버리지) 진행 전 최소 브랜드/SEO 베이스라인 확보

## 범위 (즉시 적용)
1. 문서 타이틀 및 기본 메타
- `title`: `살집 | saljip.kr`
- `meta description`: 서비스 한 줄 요약 + 핵심 키워드 포함
- `meta keywords`는 사용하지 않음

2. OG/Twitter 카드
- `og:title`: `살집 | saljip.kr`
- `og:description`: 위 description과 동일 또는 축약
- `og:type`: `website`
- `og:url`: `https://saljip.kr` (고정)
- `og:image`: 정적 이미지 (1200x630)
- `twitter:card`: `summary_large_image`
- `twitter:title`, `twitter:description`, `twitter:image` 동일 반영

3. Canonical / robots
- `link[rel=canonical]` => `https://saljip.kr`
- `robots` 기본: `index,follow`

4. 파비콘
- `/public/favicon.ico`
- `/public/favicon-32x32.png`
- `/public/favicon-16x16.png`
- `/public/apple-touch-icon.png`
- `/public/site.webmanifest`

5. 사이트 이름/브랜드 표기
- 앱 헤더/푸터/기본 마크업 내 `budongsan-v2` 문자열 제거
- `saljip.kr` 및 `살집` 반영

## 구현 위치 (Next.js 기준 예상)
- `app/layout.tsx` 또는 `app/head.tsx`
- `public/` 정적 리소스
- 텍스트 노출 컴포넌트 (헤더/푸터)

## 상세 작업 순서
1. 메타 값/텍스트 정의
- 브랜드명: `살집`
- 도메인: `saljip.kr`
- 설명 문구 초안 작성

2. 메타 태그 적용
- `title`, `description`, `og:*`, `twitter:*`, `canonical`, `robots`

3. 파비콘/아이콘 적용
- 기본 아이콘 제작 후 `public/`에 저장
- `link rel` 세트 적용

4. 노출 텍스트 정리
- UI 상단/하단/본문의 `budongsan-v2` 교체

5. 확인
- 로컬 메타 태그 렌더 확인
- OG 미리보기 확인

## 적용안 (saljip.kr)
현재 `app/layout.tsx` 메타는 `title: "budongsan-v2"`, `description: "Korean real estate MVP"`만 있고 OG/Twitter/canonical이 없습니다. `app/complexes/[id]/page.tsx`에도 페이지별 메타가 없습니다.

전역 메타(홈 기준) 정리
- Google/Naver가 `<title>`, 헤딩, `og:title` 등을 함께 보므로 타이틀·OG·H1을 동일 축으로 맞춥니다. (developers.google.com)
- `meta keywords`는 넣지 않습니다. (developers.google.com)
- 설명문은 “한 줄 요약 + 핵심 키워드” 형태로 작성하되, 홈은 사이트 수준 설명으로 둡니다. (developers.google.com)

상세 페이지 메타 생성
- Google/Naver 모두 페이지별 고유한 제목/설명을 권장하므로, `generateMetadata`로 단지명/지역 기반 타이틀·설명을 생성합니다. (developers.google.com)

Canonical/OG/Twitter/아이콘
- Naver는 대표 URL 선택 과정이 있으므로(선호 URL 지정 가능), canonical을 명시하고 OG/Twitter를 동일 값으로 유지합니다. 이는 대표 URL·노출 일관성 확보를 위한 처리로 보시면 됩니다(추정). (searchadvisor.naver.com)

예시 스케치 (layout)
```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://saljip.kr"),
  title: { default: "살집 | saljip.kr", template: "%s | 살집" },
  description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://saljip.kr" },
  openGraph: {
    title: "살집 | saljip.kr",
    description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
    url: "https://saljip.kr",
    type: "website",
    siteName: "살집",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "살집" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "살집 | saljip.kr",
    description: "서울·수도권 아파트 실거래가와 시세를 한눈에 보는 부동산 데이터 플랫폼",
    images: ["/og-default.png"]
  },
  icons: {
    icon: ["/favicon-32x32.png", "/favicon-16x16.png"],
    apple: "/apple-touch-icon.png"
  },
  verification: {
    google: "...",
    other: { "naver-site-verification": "..." }
  }
};
```

예시 스케치 (complex 상세)
```ts
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const complex = await getComplexSummaryById(Number(params.id));
  if (!complex) return {};

  const title = `${complex.aptName} 실거래가·시세`;
  const description = `${complex.regionName} ${complex.legalDong} ${complex.aptName} 아파트의 최근 실거래가, 평형별 가격, 거래 요약.`;

  return {
    title,
    description,
    alternates: { canonical: `/complexes/${params.id}` },
    openGraph: { title, description },
    twitter: { title, description }
  };
}
```

제약/주의
- 일부 Top-tier 사이트는 JS/로봇 정책 때문에 이 환경에서 `<head>` 메타 태그까지 직접 확인이 제한됐어요. 그래서 이번 벤치마크는 노출 타이틀 중심 관찰 위주입니다. 필요하면 실제 브라우저/HTML 원본 기준으로 OG/canonical까지 추가 확인해 정밀 리포트로 보완할 수 있어요.

다음으로 내가 바로 해줄 수 있는 것
- 위 메타/OG/아이콘 적용을 실제 코드에 반영하고 커밋까지 정리.
- `saljip` 한 줄 설명 문구를 2~3개 버전으로 더 다듬어 A/B 후보로 정리.

## Implementation Plan (짧게)
1. 메타 텍스트 확정
- `title`, `description` 확정 (홈/공통)
- 단지 상세용 템플릿 확정
2. 전역 메타 적용
- `app/layout.tsx`에 `metadataBase`, `title`, `description`, `openGraph`, `twitter`, `alternates`, `robots`, `icons` 적용
3. 상세 페이지 메타 적용
- `app/complexes/[id]/page.tsx`에 `generateMetadata` 추가
4. 브랜딩 텍스트 정리
- UI 텍스트 내 `budongsan-v2` 제거 및 `살집` 반영
5. 산출물 추가
- `public/`에 아이콘/OG 이미지 추가
6. 검증
- 로컬 빌드 후 `<head>` 확인
- OG 미리보기 확인

## 진행 상태 (체크)
- [x] 전역 메타 교체 (`app/layout.tsx`)
- [x] 상세 메타 생성 추가 (`app/complexes/[id]/page.tsx` `generateMetadata`)
- [x] UI 텍스트 `budongsan-v2` → `살집` 반영
- [x] 아이콘/OG 이미지 생성 (`public/`에 `og-default.png`, `apple-touch-icon.png`, `favicon-32x32.png`, `favicon-16x16.png`)
- [x] `metadata.icons` PNG 참조 복구
- [x] 로컬 빌드 통과 확인
- [x] 로컬 자산 200 응답 확인 (`/og-default.png`, `/favicon-32x32.png`, `/apple-touch-icon.png`)
- [x] Recrawl 요청 완료 (Google Search Console + Naver Search Advisor)
- [ ] OG 미리보기 툴(카카오/페이스북/네이버) 확인
  - 카카오: 홈(`/`) 캐시 초기화 후 디버그 확인 완료 (제목/설명/이미지 정상)
  - 네이버: 홈(`/`) 공유 미리보기 확인 완료 (제목/설명/이미지 정상)
  - 네이버: 대표 상세(`/complexes/452`) 공유 미리보기 확인 완료 (제목/설명 정상)
  - 페이스북: 홈(`/`) Debug/Scrape 확인 완료 (제목/설명/이미지 정상)

## 실행 결과/검증
- `npm run build` 성공 (TypeScript/페이지 수집/정적 생성 통과)
- 로컬 스모크 테스트: `/`, `/complexes/1`, `/complexes/452` 200 확인
- OG/아이콘 자산 200 확인: `/og-default.png`, `/favicon-32x32.png`, `/apple-touch-icon.png`

## 수정 내역 요약
- `generateMetadata`에서 `params` Promise 언랩 및 `id` 유효성 가드 추가
- `canonical`은 언랩된 `id`로 생성
- `app/complexes/[id]/page.tsx` 한글 인코딩 깨짐 복구 (문구/태그 복원)
- `app/complexes/[id]/page.tsx` 금액 포맷 `억/만원` 정상화
- `components/Explorer.tsx` UI 문구 정상화 및 기본 검색어 처리

## Recrawl 요청 체크리스트
1. 배포 후 라이브 HTML 확인
- 홈(`/`)과 대표 상세(`/complexes/{id}`)에서 `<title>`이 `살집`으로 노출되는지 확인
2. Google Search Console
- URL Inspection → Request indexing (홈 + 대표 상세 1~3개)
3. Naver Search Advisor
- 웹마스터 도구 → URL 제출 (홈 + 대표 상세 1~3개)
4. 확인 주기
- 24~72시간 내 SERP 타이틀/스니펫 갱신 여부 확인

## OG 미리보기 체크리스트 (카카오/네이버)
아래는 **실제로 URL을 넣고 확인하는 절차**만 뽑은 체크리스트입니다.

### 준비할 URL (복사해서 사용)
- 홈: `https://saljip.kr/`
- 대표 상세(예시): `https://saljip.kr/complexes/452`

### 카카오 OG 캐시 초기화 + 미리보기 확인
Kakao Developers FAQ 기준, **도구 > 초기화 도구 > OG(Open Graph) 캐시**에서 캐시 삭제를 진행합니다.

1. 카카오 OG 캐시 초기화 도구 접속 (로그인 필요)
```
https://developers.kakao.com/tool/clear/og
```
2. 입력창에 확인할 URL 붙여넣기
3. **캐시 초기화(삭제/확인) 버튼** 클릭
4. 카카오톡에서 해당 URL을 공유했을 때
   - 제목/설명/이미지가 `살집` 기준으로 바뀌는지 확인

### 네이버 공유 미리보기 확인 (shareView)
네이버 공유 UI는 아래 형식으로 URL을 생성해 확인합니다.

1. 아래 URL 중 하나를 브라우저에 붙여넣기
- 홈 미리보기
```
https://share.naver.com/web/shareView?url=https%3A%2F%2Fsaljip.kr%2F&title=%EC%82%B4%EC%A7%91%20%7C%20saljip.kr
```
- 대표 상세 미리보기
```
https://share.naver.com/web/shareView?url=https%3A%2F%2Fsaljip.kr%2Fcomplexes%2F452&title=%EC%82%B4%EC%A7%91%20%7C%20saljip.kr
```
2. 공유 카드에 노출되는 **제목/설명/이미지**가 최신값인지 확인

## Recommendation
- 카카오/네이버 공유 미리보기는 **선택 사항**이지만, 브랜드 전환을 **빠르게 노출**하고 싶다면 지금 요청하는 것을 권장.
- 급하지 않다면 생략해도 되며, 이 경우 **자동 캐시 갱신까지 대기**해야 함.

## 추가 권장 작업 (동일한 ‘즉시’ 범주)
- `sitemap.xml`과 `robots.txt` 기본 생성
- `og:image` 기본 이미지 제작

## 제외 (기반공사 이후)
- 지역(geo) 메타, 구조화 데이터 고도화
- SEO 키워드 랜딩 페이지 확장
- 고급 성능/코어웹바이탈 최적화
