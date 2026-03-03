# LOCATION_ACCURACY_PHASE_PLAN

- 작성일: 2026-03-01
- 갱신일: 2026-03-03
- 목적: 지도 검색 신뢰도를 위해 좌표 정확도(Data Quality)와 자동 점검 체계를 고정

## 원칙
- UX 확장보다 먼저 데이터 품질/운영 안정성을 고정한다.
- 런칭 게이트는 수치 기준으로 통과/실패를 판단한다.

## 안정 런칭 게이트
- `exactRatio >= 0.80`
- `failRatio <= 0.05`

## 현재 기준 상태
- exactRatio: 0.8219
- failRatio: 0.0435
- 기준 충족 상태

## 기반 고정 작업
1. 지오코딩 백필 파이프라인
- queue 기반 재시도
- reverse 검증
- 실패/영구실패 분리

2. KPI/게이트 자동 점검
- `/api/ops/location-quality`
- CLI 게이트 체크 스크립트

3. 유지보수 자동 루프
- enqueue + backfill 반복
- 목표치 도달 시 종료

## 실행 명령
```bash
npm run db:geocode-schema
npm run geocode:enqueue
npm run geocode:backfill
npm run ops:location-gate
npm run geocode:maintain
```

## 환경변수
- `DATABASE_URL`
- `KAKAO_REST_API_KEY`
- `CRON_SECRET`

## cron 운영
- 엔드포인트: `GET /api/cron/geocode-maintain`
- 인증: `x-cron-secret` 또는 `Authorization: Bearer <CRON_SECRET>`
- Hobby 제약 반영: 하루 1회 스케줄만 사용

## 운영 체크
1. 배포 직후: `npm run ops:location-gate`
2. 기준 미달 시: `npm run geocode:maintain` 후 재점검
3. 모니터링: `/api/ops/location-quality` pending/failed 추이

## 다음 단계(기반 완료 후)
- map/list 상호작용 UX 개선
- 상세 위치 신뢰 라벨 정책 고도화
- 모니터링 대시보드 확장
