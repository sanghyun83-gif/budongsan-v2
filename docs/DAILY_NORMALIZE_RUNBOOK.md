# 일일 정규화 Runbook

## 목적
`deal_trade_raw` 데이터를 하루 1회 `deal_trade_normalized`로 정규화한다.

## 자동 스케줄 (Vercel cron)
- 설정 파일: `vercel.json`
- 경로: `/api/cron/normalize`
- 스케줄: `0 18 * * *` (UTC, KST 기준 매일 03:00)

## 인증
다음 2가지 헤더 방식을 모두 지원한다.
1. `x-cron-secret: <CRON_SECRET>`
2. `Authorization: Bearer <CRON_SECRET>`

환경변수:
- `CRON_SECRET`
- `DATABASE_URL`

## 방법 A: 수동 실행(SQL)

```bash
npm run db:normalize
```

실행 파일:
- `sql/003_normalize_from_raw.sql`

## 방법 B: 예약 HTTP 트리거

endpoint:
- `GET /api/cron/normalize`

예시:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" https://budongsan-v2.vercel.app/api/cron/normalize
```

정상 응답 예시:

```json
{
  "ok": true,
  "insertedCount": 0,
  "ranAt": "2026-03-01T00:00:00.000Z"
}
```

## 장애 대응
1. Vercel Function 로그에서 `/api/cron/normalize` 확인
2. `DATABASE_URL`, `CRON_SECRET` 값 점검
3. `npm run db:normalize` 수동 재실행
4. SQL 파싱 실패 시 `deal_trade_raw.payload_json` 키 구조 점검
