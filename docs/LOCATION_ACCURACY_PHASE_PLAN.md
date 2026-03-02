# LOCATION_ACCURACY_PHASE_PLAN

- 작성일: 2026-03-01
- 갱신일: 2026-03-02
- 목적: 지도/검색 신뢰도를 위해 좌표 정확도(Data Quality)와 운영 자동화 기반을 고정

## 원칙
- UX보다 먼저 데이터 품질과 운영 안정성을 고정한다.
- 런칭 게이트는 수치 기준으로 통과/실패를 판단한다.

## 안정 런칭 게이트
- `exactRatio >= 0.80`
- `failRatio <= 0.05`

## 현재 상태(기준)
- exactRatio: 0.8219
- failRatio: 0.0435
- 기준 충족 상태

## 기반 고정 작업(진행 중)
1. 지오코딩 백필 파이프라인
- queue 기반 재시도
- reverse 검증
- 실패/영구실패 분리

2. KPI/게이트 자동 점검
- `/api/ops/location-quality` API
- CLI 게이트 체크 스크립트

3. 유지보수 자동 실행 루프
- enqueue + backfill 라운드 반복
- 목표치 도달 시 종료

## 실행 커맨드
1. 지오코딩 스키마 적용(최초 1회)
```bash
npm run db:geocode-schema
```

2. 큐 적재
```bash
npm run geocode:enqueue
```

3. 백필 단건 실행
```bash
npm run geocode:backfill
```

4. 게이트 체크
```bash
npm run ops:location-gate
```

5. 유지보수 자동 루프
```bash
npm run geocode:maintain
```

## 환경변수
- `DATABASE_URL`
- `KAKAO_REST_API_KEY` (REST API Key)

## 런북
1. 배포 직후
- `npm run ops:location-gate`

2. 게이트 미충족 시
- `npm run geocode:maintain`
- 재확인: `npm run ops:location-gate`

3. 운영 모니터링
- `/api/ops/location-quality`
- pending/failed 추이 확인

## Cron 연동(운영 자동화)
- 엔드포인트: `GET /api/cron/geocode-maintain`
- 인증: `x-cron-secret` 또는 `Authorization: Bearer <CRON_SECRET>`
- 권장 배치 환경변수:
  - `GEOCODE_CRON_BATCH=15`
  - `GEOCODE_ENQUEUE_LIMIT=300`
- 스케줄(`vercel.json`): `15 */2 * * *` (2시간마다 실행)

### 점검 명령(로컬/프로덕션)
```powershell
$BASE_URL = "https://budongsan-v2.vercel.app"
$CRON_SECRET = "<YOUR_CRON_SECRET>"
Invoke-RestMethod -Method GET -Uri "$BASE_URL/api/cron/geocode-maintain" -Headers @{ "x-cron-secret" = $CRON_SECRET }
```

정상 기준:
- `ok: true`
- `processed/success/failed` 필드 존재
- `gate.exactRatio`, `gate.failRatio` 필드 존재

## 다음 단계(기반 완료 후)
- 마커 클릭 연동(P1 UX)
- 리스트 하이라이트/스크롤 연동
- 모바일 동선 최적화