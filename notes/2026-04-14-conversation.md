# Conversation Log (2026-04-14)

## 요청 요약
- `/complexes/52050` 실거래 매매가 차트를 아차 스타일 참고해 개선.
- 겹침/중복(축 라벨, 선 중복, 라벨 충돌) 문제 해결.
- SEO 보강(JSON-LD Dataset/WebPage).
- 이후 스타일 요청:
  - "전체 전용면적" 문구 변경
  - 고급 옵션(면적보정 평균가 토글) 추가
  - 선 두께/강조감 조정
  - 전체 적용 범위 점검

## 최종 반영 사항

### 1) 차트 UI/데이터
- 공통 컴포넌트: `components/SandboxTradeChartMock.tsx`
- 페이지 연결: `app/complexes/[id]/page.tsx`
- 반응형 폭: `ResizeObserver`
- 기간 고정 제거, 데이터 기간 기반 축 사용
- 동일 일자 다건 거래는 선 계산 시 중앙값(median) 집계
- 곡선은 monotone path 사용
- 최근 3개월 선/기본선 겹침은 clip 처리로 중복 시각 완화

### 2) 레이블/겹침 개선
- Y축 제목 텍스트를 차트 상단 캡션으로 이동
- 좌측 여백 확대
- 최고/최저 라벨 pill 배경 + 충돌 회피 오프셋

### 3) 문구/옵션 변경
- `전체 전용면적` → `전체 면적 통합`
- 고급 토글 추가: `면적보정 평균가(㎡당 환산)`
  - 전체 면적 통합일 때만 표시
  - 켜면 ㎡당 단가 환산 후 대표면적(평균 면적) 기준으로 재환산
  - 특정 평형 선택 시 토글 자동 해제

### 4) 선 스타일 조정
- 사용자 요청에 맞춰 최근 3개월 강조선을 진하게 두지 않고,
  기본선과 유사한 옅은 톤/두께로 통일

### 5) 적용 범위 점검 결과
- 상세 라우트 스캔 결과:
  - `app/complexes/[id]/page.tsx` 단일 상세 라우트
- 즉, 공통 컴포넌트 수정사항은 `/complexes/*` 전 경로에 동일 적용됨

## 변경 파일
- `components/SandboxTradeChartMock.tsx`
- `app/complexes/[id]/page.tsx`

## 검증
- ESLint 실행 및 통과
  - `npx eslint components/SandboxTradeChartMock.tsx app/complexes/[id]/page.tsx`

---

저장 위치: `notes/conversation.md`
