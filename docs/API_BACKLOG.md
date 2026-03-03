# API_BACKLOG (MVP)

## P0
1. `GET /api/complexes/:id`
- 설명: 단지 기본 정보 + 최신 거래/요약 지표 조회
- 출력: 단지 정보, 위치, latest_deal, updated_at

2. `GET /api/complexes/:id/deals`
- 설명: 최근 거래 이력 pagination 조회
- query: `page`, `size`, `from`, `to`(확장 예정)
- 출력: 거래 목록 + 기본 메타

3. `GET /api/search` 품질 고정
- 정렬/필터 동작 일관성
- 가격 파라미터 상한 검증(INT overflow 방지)
- source metadata, `updatedAt` 노출

4. `GET /api/map/complexes` 정합성 유지
- search와 동일 필터 기준 유지
- bbox + sort + exact_only 동작 점검

## P1
5. `GET /api/metrics/complex/:id`
- 설명: 사전 계산된 3개월/6개월 지표 조회

6. `POST /api/ingest/molit/run` (internal)
- 설명: 수동 ingest 트리거(보호 endpoint)

7. `GET /api/ops/traffic-funnel` (신규)
- 설명: 검색→상세→CTA 전환 퍼널 요약

## 테스트 케이스
1. invalid id -> 400/404
2. no data -> `ok=true` + empty payload
3. DB unavailable -> 503
4. 대량 요청 시 latency/p95 로그 기록
5. `min_price/max_price` 비정상 큰 값 요청 시 400 또는 안전 처리
