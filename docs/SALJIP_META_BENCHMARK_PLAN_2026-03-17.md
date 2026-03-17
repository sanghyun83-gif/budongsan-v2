# SALJIP Meta Benchmark Plan (Headless)

## 목적
Top-tier 부동산 사이트의 메타 패턴을 **렌더링 기준으로 수집**하고, 그대로 모방하지 않고 **패턴만 추출해 살집에 맞게 최적화 적용**한다.

## 왜 헤드리스인가
- curl/단순 요청은 403/JS 렌더링으로 메타가 비어 있는 경우가 많음.
- Playwright/Puppeteer로 실제 렌더링 후 `<title>`, `og:*`, `canonical` 등 추출이 가능.

## 원칙 (모방 금지, 패턴만 적용)
- 문구/표현은 **살집 고유 문구**로 작성
- 구조/길이/필수요소(OG, canonical, title 규칙)만 참고
- 누락 요소는 보완, 과도한 키워드 삽입은 금지

## 대상 (예시)
### 앱 기반 Top-tier (깊게)
- 직방
- 다방
- 호갱노노

### 시세/데이터 포털 (얕게)
- KB부동산 (kbland)
- 부동산114 (r114)
- 아실

## 샘플 URL 구성
- 홈
- 검색/목록
- 상세(단지)

## 수집 대상 필드
- title
- meta[name=description]
- link[rel=canonical]
- meta[property^="og:"]
- meta[name^="twitter:"]
- robots
- (있다면) JSON-LD schema

## 산출물
1) 메타 벤치마크 요약 테이블
- 사이트 / 페이지 유형 / title 패턴 / description 길이 / og 필수 여부 / canonical 유무

2) 살집 적용 가이드
- title 템플릿
- description 템플릿
- OG/Twitter 기본값 + 상세값 규칙
- canonical 규칙

## 적용 후보 (살집)
- title: `{단지명} 실거래가·시세 | 살집`
- description: `{지역} {동} {단지명} 아파트 최근 실거래가, 평형별 가격, 거래 요약.`
- og:image: 기본값 사용 (필요 시 단지별 이미지 확장)
- canonical: 절대 URL 고정

## 실행 플로우
1. 대상 사이트/URL 확정
2. Playwright 스크립트로 메타 추출
3. 비교표 작성
4. 살집 템플릿 확정
5. 코드 반영 → 검증

## Playwright 스크립트 (로컬 실행용)
아래 스크립트는 페이지를 렌더링한 뒤 메타를 추출해 JSON으로 저장한다.

### 스크립트 위치
- `scripts/meta-benchmark.mjs`

### 스크립트 내용
```js
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const targets = [
  // 앱 기반 (깊게)
  "https://www.zigbang.com",
  "https://www.dabangapp.com",
  "https://hogangnono.com",
  // 포털/데이터 (얕게)
  "https://kbland.kr",
  "https://www.r114.com",
  "https://asil.kr",
];

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (HeadlessBenchmark)" });
  const results = [];

  for (const url of targets) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

      const data = await page.evaluate(() => {
        const title = document.title || "";
        const description = (document.querySelector("meta[name='description']") || {}).content || "";
        const canonical = (document.querySelector("link[rel='canonical']") || {}).href || "";
        const og = Array.from(document.querySelectorAll("meta[property^='og:']")).map((el) => ({
          property: el.getAttribute("property"),
          content: el.getAttribute("content"),
        }));
        const twitter = Array.from(document.querySelectorAll("meta[name^='twitter:']")).map((el) => ({
          name: el.getAttribute("name"),
          content: el.getAttribute("content"),
        }));
        return { title, description, canonical, og, twitter };
      });

      results.push({ url, ...data });
    } catch (err) {
      results.push({ url, error: String(err) });
    }
  }

  await browser.close();
  writeFileSync("notes/meta-benchmark.json", JSON.stringify(results, null, 2), "utf8");
  console.log("Saved: notes/meta-benchmark.json");
};

run();
```

### 실행
```bash
node scripts/meta-benchmark.mjs
```

### Windows CMD 실행 예시
```cmd
cd /d C:\Users\Sam\Desktop\budongsan-v2
node scripts\meta-benchmark.mjs
```

### 결과 사용
- `notes/meta-benchmark.json`을 표로 정리해서 메타 패턴 요약 테이블 작성
- “모방 금지, 패턴만 적용” 원칙에 따라 살집 템플릿에 반영

## 실행 결과 (2026-03-17)
- 결과 파일: `notes/meta-benchmark.json`
- 수집 요약
- 직방: 403/차단 추정 → 메타 미수집
- 다방: canonical 있음, `og:url` 빈 값, `og:type=website`
- 호갱노노: canonical 없음, `og:type` 없음
- KB부동산: canonical 있음, `og:type` 없음
- 부동산114: `og:url`이 http, canonical 없음
- 아실: canonical이 http + deep path, `og:type` 없음

## 요약표 (1차)
| 사이트 | 접근 결과 | title | description | canonical | OG 핵심 | Twitter 카드 |
| --- | --- | --- | --- | --- | --- | --- |
| 직방 | 403/차단 추정 | 수집 실패 | 수집 실패 | 수집 실패 | OG 미확인 | 미확인 |
| 다방 | OK | 있음 | 있음 | 있음 | `og:type`, `og:title`, `og:description`, `og:image` (`og:url` 비어있음) | `summary` |
| 호갱노노 | OK | 있음 | 있음 | 없음 | `og:title`, `og:description`, `og:url`, `og:image` (`og:type` 없음) | `summary_large_image` |
| KB부동산 | OK | 있음 | 있음 | 있음 | `og:title`, `og:description`, `og:url`, `og:image` (`og:type` 없음) | `summary_large_image` |
| 부동산114 | OK | 있음 | 있음 | 없음 | `og:url`(http), `og:type`, `og:image`, `og:title`, `og:description` | 없음 |
| 아실 | OK | 있음 | 있음 | 있음 (http, deep path) | `og:title`, `og:description`, `og:url`, `og:image` (`og:type` 없음) | 없음 |

### 관찰 포인트
- OG 이미지/타이틀/설명은 **대부분 명시**
- `og:url`/`og:type`는 **사이트마다 편차**
- canonical은 **사이트마다 편차**
- 일부 포털은 **http URL/canonical** 또는 **deep path canonical** 사용 → 살집은 **https + 대표 URL**로 고정 권장
- Twitter 카드 타입이 **summary vs summary_large_image**로 갈림
- 직방은 **헤드리스 수집 차단 가능성** 높음 → 추가 대응 필요

## 적용 규칙 (살집)
- **필수 OG**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- **canonical**: https 절대 URL로 항상 명시 (중복/캐시 리스크 방지)
- **Twitter 카드**: 기본 `summary_large_image` 유지
- **title/description 템플릿**: 고유 문구 유지 (복제 금지)
- **OG 이미지**: 기본 이미지 유지, 필요 시 단지별 이미지 확장 고려

### 살집 적용 체크
- 홈: OG/Canonical/Twitter 모두 일치
- 상세: OG/Canonical/Twitter 모두 일치 + `og:url`/`og:type` 명시

## 다음 액션
- 결과 테이블 유지/확장
- 살집 메타 템플릿 확정 및 코드 반영
- 적용 후 공유/검색 미리보기 재확인
