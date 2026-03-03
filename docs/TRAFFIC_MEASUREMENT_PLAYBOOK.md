# Traffic Measurement Playbook

## 목적
- Vercel 배포 이후 실제 유입과 핵심 전환(검색, 상세 진입)을 측정한다.
- MVP 단계에서 채널별 성과를 빠르게 비교한다.

## 1) Enable Analytics
1. Vercel 프로젝트 `budongsan-v2` 접속
2. `Analytics` 메뉴에서 `Web Analytics` 활성화
3. 가능하면 `Speed Insights`도 활성화

## 2) UTM 링크 표준
- 기본 규칙
  - `utm_source`: 유입 채널 (예: naver, dcinside, youtube)
  - `utm_medium`: 매체 유형 (예: community, cpc, social)
  - `utm_campaign`: 캠페인명 (예: mvp_test_week1)

- 예시 URL
```text
https://budongsan-v2.vercel.app/?utm_source=naver&utm_medium=community&utm_campaign=mvp_test_week1
```

## 3) 최소 전환 이벤트 정의
- `search_submit`: 검색 버튼 클릭
- `complex_detail_view`: 단지 상세 페이지 진입
- `cta_click`: 관심등록/알림/문의 CTA 클릭

권장: 기존 `/api/events/cta`를 포함해 이벤트명을 통일해서 저장.

## 4) QA 테스트 시나리오
1. UTM 붙은 URL로 랜딩
2. 검색 1회 실행 (`q=래미안`)
3. 검색 결과 카드 클릭 후 상세 진입
4. CTA 1회 클릭
5. Vercel Analytics/Logs에서 유입 및 이벤트 확인

## 5) 부하 테스트 (기술 확인용)
주의: 유입 성과 측정과 별개다. 과도한 호출 금지.

PowerShell 예시:
```powershell
1..100 | ForEach-Object {
  Invoke-WebRequest "https://budongsan-v2.vercel.app/api/search?q=래미안&page=1&size=20" | Out-Null
}
```

## 6) Daily KPI (MVP)
- Users
- Page Views
- 검색 실행 수 (`search_submit`)
- 상세 진입 수 (`complex_detail_view`)
- 전환율: 상세 진입 수 / 검색 실행 수
- 에러율: `/api/search`, `/api/map/complexes` 4xx/5xx 비율

## 7) 운영 기준 (초기)
- API 5xx 비율: 1% 미만 유지
- 검색->상세 전환율: 주차별 개선 추세 확인
- 채널별 UTM 성과 비교 후 상위 1~2개 채널 집중

## 8) 점검 루틴
- 매일 오전: 전일 KPI 기록
- 주 1회: 채널 성과 리뷰 및 UTM 정리
- 오류 급증 시: Vercel Logs에서 최근 30분 우선 확인
