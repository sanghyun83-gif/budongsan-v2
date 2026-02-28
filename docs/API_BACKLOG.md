# API_BACKLOG (MVP-2)

## P0
1. `GET /api/complexes/:id`
- 설명: 단지 프로필 + 최신 지표 스냅샷 조회
- 출력: 식별 정보, 위치, latest_deal, updated_at

2. `GET /api/complexes/:id/deals`
- 설명: 최근 거래 이력 pagination 조회
- query: page, size, from, to
- 출력: 거래 목록 + 요약

3. `GET /api/search` 스키마 안정화
- 추가: 표준 item 타입, source metadata, updated_at

## P1
4. `GET /api/metrics/complex/:id`
- 설명: 사전 계산된 3개월 지표 조회

5. `POST /api/ingest/molit/run` (internal)
- 설명: 수동 ingest 트리거(보호 endpoint)

## 테스트 케이스
1. invalid id -> 400/404
2. no data -> `ok=true` + 빈 payload
3. DB unavailable -> 표준화된 503
4. 요청별 latency 로그 출력

