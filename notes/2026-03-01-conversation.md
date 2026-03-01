# Conversation Notes - 2026-03-01

## 오늘 진행 내용
1. 런칭 후속 작업에서 `CRON_SECRET` 설정/재배포/cron API 검증 진행
2. `vercel.json` 배포 실패 원인 확인 및 수정
   - 원인: BOM 포함으로 `Invalid vercel.json`
   - 조치: BOM 제거 후 정상 배포 가능 상태로 수정
3. 프로덕션 cron endpoint 검증 성공
   - `GET /api/cron/normalize` 응답: `ok: true`
4. Hydration mismatch 이슈 수정
   - `Explorer`의 초기 `updatedAt`를 `new Date()` 기반에서 `null` 기반으로 변경
5. Next Phase(MVP-3) Day 1-2 착수
   - `scripts/ingest-molit.mjs` 추가
   - `package.json`에 ingest 명령 추가
   - `docs/DATA_COVERAGE_RUNBOOK.md`, `docs/PHASE3_EXECUTION_LOG.md` 추가
6. 데이터 적재 검증
   - dry-run(강남 3개월): fetched/normalized 확인
   - 실제 적재(강남 3개월, 200건 제한): raw 197, normalized 200

## 현재 상태
1. cron 보안/호출은 동작 확인 완료
2. MVP-3 데이터 커버리지 확장 스크립트 준비 완료
3. 서울권 대량 적재는 장시간 작업이라 사용자 요청으로 중단

## 내일 이어서 할 작업
1. 서울 핵심권역 배치 적재 실행
   - 권장: 지역을 나눠 배치 실행(타임아웃 방지)
2. 적재 후 DB 커버리지 집계 확인
   - complex 수, normalized 수, 지역별 거래 건수
3. 검색 0건 비율 확인
4. 다음 단계: `/api/search` 정렬(sort) 구현 착수

## 참고 명령
```bash
# 빠른 배치(권장)
npm run ingest:molit -- --regions=11680,11650,11710,11440,11200 --months=2 --maxPerRegion=600

# 기본 서울 3개월
npm run ingest:molit:seoul3m
```
