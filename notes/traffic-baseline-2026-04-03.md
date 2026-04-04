# Traffic Baseline Snapshot (2026-04-03)

## 목적
- HYBRID 계획의 Phase 0 기준선(비교 기준)을 고정한다.
- 이후 D+7 / D+30 성과 비교의 기준 데이터로 사용한다.

## 수집 범위
- 기간: 최근 28일
- 채널: 전체(Organic / Direct / Referral / Social)
- 도구: GA4, GSC

---

## 1) GA4 기준선
> 실제 수치는 GA4 대시보드 확인 후 아래 표에 입력

| 지표 | 값 | 비고 |
| --- | ---: | --- |
| 활성 사용자 (28d) | 임시값(수동 입력 필요) | GA4 접근 후 확정 |
| 참여 세션수 (28d) | 임시값(수동 입력 필요) | GA4 접근 후 확정 |
| 평균 참여시간 | 임시값(수동 입력 필요) | GA4 접근 후 확정 |
| 국가 Top3 | 임시값(수동 입력 필요) | GA4 접근 후 확정 |

### 체크
- [ ] 최근 28일 기준 스냅샷 저장 (GA4 실측 입력 필요)
- [ ] 비교용 스크린샷/CSV 저장 (폴더 또는 링크)

---

## 2) GSC 기준선
> 실제 수치는 GSC 성능 리포트 확인 후 입력

| 지표 | 값 | 비고 |
| --- | ---: | --- |
| 총 노출수 (28d) | 160 (임시) | 출처: `docs/SALJIP_GOOGLE_SERP_GSC_ADDITIONAL_ANALYSIS_2026-03-27.md` |
| 총 클릭수 (28d) | 2 (임시) | 출처: 동일 |
| 평균 CTR | 1.3% (임시) | 출처: 동일 |
| 평균 순위 | 8.3 (임시) | 출처: 동일 |

### 상위 쿼리/페이지 추출
- [ ] 상위 쿼리 50개 추출
- [ ] 상위 페이지 50개 추출
- [ ] 노출↑ 클릭↓ 후보 20개 표시

---

## 3) 이벤트 기준선
- 목표 표준: `view_search_results`, `map_pin_click`, `detail_view`

현재 코드 상태(2026-04-04):
- 검색 이벤트: `view_search_results` 송신 중
- 상세 이벤트: `detail_view` 송신 중
- 맵 핀 클릭 이벤트: `map_pin_click` 송신 중

### 작업
- [x] 표준 이벤트명으로 네이밍 정규화
- [x] `map_pin_click` 추가
- [ ] 이벤트 파라미터 최소셋 고정 (`search_term`, `complex_id`, `source`)

---

## 4) 기준선 판정
- [ ] GA4 수치 입력 완료
- [ ] GSC 수치 입력 완료
- [ ] 상위 50 쿼리/페이지 추출 완료
- [ ] 이벤트 표준 전환 계획 확정

## 메모
- 실행 기준 문서: `docs/SALJIP_HYBRID_TRAFFIC_IMPLEMENTATION_PLAN_2026-04-03.md`
- 결정 근거 문서: `docs/SALJIP_TOP_TIER1_FULL_BENCHMARK_REPORT_2026-03-30.md`
