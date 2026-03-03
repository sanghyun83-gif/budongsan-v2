# Traffic Measurement Checklist

## Launch Day
- [ ] Vercel `Web Analytics` 활성화
- [ ] `Speed Insights` 활성화
- [ ] 기준 UTM 3개 생성
- [ ] 공지/커뮤니티/지인 테스트 링크 배포

## UTM Setup
- [ ] `utm_source` 채널명 통일 (예: naver, youtube, dcinside)
- [ ] `utm_medium` 타입 통일 (community, social, cpc)
- [ ] `utm_campaign` 주차 단위로 관리 (예: mvp_test_week1)

## Event Tracking
- [ ] `search_submit` 이벤트 수집 확인
- [ ] `complex_detail_view` 이벤트 수집 확인
- [ ] `cta_click` 이벤트 수집 확인
- [ ] 이벤트 누락 시 `/api/events/cta` 로그 점검

## QA Flow (Desktop + Mobile)
- [ ] UTM 랜딩 URL 접속
- [ ] 검색 실행 (`q=래미안`)
- [ ] 결과 카드 클릭 후 상세 이동
- [ ] CTA 클릭 1회
- [ ] Analytics 대시보드 반영 확인

## API Health
- [ ] `/api/search` 5xx 비율 확인
- [ ] `/api/map/complexes` 5xx 비율 확인
- [ ] 4xx 급증 시 파라미터 검증 로직 점검

## Daily Routine
- [ ] Users / Page Views 기록
- [ ] 검색 실행 수 기록
- [ ] 상세 진입 수 기록
- [ ] 검색→상세 전환율 기록
- [ ] 오류 로그(최근 30분) 점검

## Weekly Review
- [ ] 채널별 UTM 성과 비교
- [ ] 전환율 상위 채널 1~2개 집중
- [ ] 저효율 채널/문구 정리
- [ ] 다음 주 테스트 가설 1~2개 정의
