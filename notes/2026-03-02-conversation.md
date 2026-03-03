# Conversation Notes - 2026-03-02

## 오늘 진행 요약
- Vercel 배포 실패 원인 확인: 빌드 실패가 아니라 `/api/search`, `/api/map/complexes` 런타임 400 에러 확인.
- 핵심 에러: `value ... is out of range for type integer` (가격 파라미터가 DB INT 범위 초과).
- API 보강:
  - `app/api/search/route.ts`
  - `app/api/map/complexes/route.ts`
  - `min_price`, `max_price`에 INT 상한 검증(`2_147_483_647`) 추가.
- 프론트 보강:
  - `components/Explorer.tsx`
  - 가격 입력 sanitize/clamp 적용, 숫자 입력 유도(`inputMode="numeric"`).
- 인코딩 이슈 복구:
  - `Explorer.tsx` UTF-8 깨짐 복구 및 BOM 제거.
- 검증:
  - `npm run build` 성공 확인.

## 현재 상태
- 로컬 빌드 정상.
- 가격 초과 입력으로 인한 DB INT overflow 에러 재발 방지 코드 반영.
- 변경 파일 3개가 Git 변경 상태.

## 사용자 다음 액션
- Git 반영:
  - `git add .`
  - `git commit -m "fix: guard price params and restore explorer utf8"`
  - `git push origin main`
- Vercel 재배포 후 프로덕션 동작 확인.
