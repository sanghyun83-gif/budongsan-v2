# SALJIP Sitemap / Robots Submission Log (2026-04-04)

## 목적
- HYBRID Phase 3 `sitemap/robots 제출 완료` 체크를 닫기 위한 수동 제출 로그를 남긴다.

## 기술 상태 (코드)
- [x] sitemap 분할 반영 (`/sitemap/[id].xml`)
- [x] URL별 `lastmod` 반영 (`complex.updated_at`)
- [x] robots 설정 반영 (`/robots.txt` + sitemap 경로)

## 제출 대상
- robots: `https://saljip.kr/robots.txt`
- sitemap index(Next metadata): `https://saljip.kr/sitemap.xml`
- 분할 sitemap 예시:
  - `https://saljip.kr/sitemap/0.xml`
  - `https://saljip.kr/sitemap/1.xml`

## GSC 제출 로그
- [ ] Search Console 속성 선택
- [ ] `sitemap.xml` 제출
- [ ] 제출 상태 `성공` 확인
- [ ] 주요 URL 5개 `URL 검사 → 색인 생성 요청`

기록:
- 제출 시각: `YYYY-MM-DD HH:mm`
- 상태: `대기 / 성공 / 오류`
- 비고: `__________`

## 네이버 서치어드바이저 제출 로그
- [ ] 사이트맵 제출
- [ ] robots 수집 정상 확인
- [ ] 대표 URL 5개 수집 요청

기록:
- 제출 시각: `YYYY-MM-DD HH:mm`
- 상태: `대기 / 성공 / 오류`
- 비고: `__________`

## 완료 판정
- [ ] GSC 제출 성공
- [ ] 네이버 제출 성공
- [ ] 제출 오류 없음
- [ ] HYBRID 체크리스트 `sitemap/robots 제출 완료` 체크 전환
