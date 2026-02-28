# COMPONENT_SYSTEM

- 버전: v1.0
- 날짜: 2026-02-28
- 범위: MVP-2 재사용 UI 컴포넌트

## 1. 컴포넌트 인벤토리

### 1.1 레이아웃
1. `PageShell`
- Header + content + footer 컨테이너

2. `SplitMapLayout`
- Desktop: 지도 + 리스트 분할
- Mobile: 지도 + bottom sheet

### 1.2 검색/필터
1. `SearchBar`
- Props: `value`, `onChange`, `onSubmit`

2. `FilterBar`
- Props: `region`, `minPrice`, `maxPrice`, `onChange`

3. `ResultMeta`
- Props: `count`, `updatedAt`, `sourceLabel`

### 1.3 지도
1. `MapView`
- Props: `center`, `bounds`, `markers`, `onBoundsChanged`

2. `MapMarker`
- Props: `id`, `lat`, `lng`, `label`, `active`

### 1.4 리스트
1. `ComplexList`
- Props: `items`, `selectedId`, `onSelect`

2. `ComplexListItem`
- 필드: aptName, legalDong, latestPrice, latestDate

### 1.5 상세
1. `ComplexHeader`
- Props: `aptName`, `address`, `updatedAt`

2. `TrustPanel`
- Props: `source`, `asOf`, `updatedAt`

3. `MetricCards`
- Props: recentPrice, dealCount3m, areaBands

4. `DealHistoryTable`
- Props: `deals[]`

5. `StickyActionBar`
- 버튼: favorite, alert, contact (placeholder)

### 1.6 상태 컴포넌트
1. `LoadingState`
2. `EmptyState`
3. `ErrorState`

## 2. 스타일 토큰(MVP)

### 2.1 색상
1. `--bg`: #f8fafc
2. `--surface`: #ffffff
3. `--text`: #0f172a
4. `--muted`: #475569
5. `--primary`: #0f766e
6. `--danger`: #b91c1c

### 2.2 간격
1. scale: 4, 8, 12, 16, 24, 32

### 2.3 radius
1. 카드 radius: 12
2. 지도 패널 radius: 16

### 2.4 타이포그래피
1. heading: 700 weight
2. body: 400/500 weight
3. meta: 작은 muted 텍스트

## 3. 데이터 계약(UI)

```ts
interface ComplexListItemVM {
  id: string;
  aptName: string;
  legalDong: string;
  regionName: string;
  latestPrice?: number;
  latestDealDate?: string;
  lat?: number;
  lng?: number;
}

interface ComplexDetailVM {
  id: string;
  aptName: string;
  legalDong: string;
  regionName: string;
  updatedAt?: string;
  source: string;
  recentPrice?: number;
  dealCount3m?: number;
  areaBands: Array<{ label: string; price?: number }>;
  deals: Array<{ date: string; price: number; areaM2: number; floor?: number }>;
}
```

## 4. 상호작용 규칙
1. 검색 입력 후 Enter 또는 버튼 클릭 시 조회
2. 지도 이동 시 debounce 후 재조회
3. 리스트 선택 시 상세 이동
4. 오류 상태에서 Retry 제공

## 5. 접근성 규칙
1. 버튼/입력에 `aria-label` 제공
2. 대비 비율 WCAG AA 준수
3. 키보드 포커스 표시
4. 상태 메시지 스크린리더 영역 제공

## 6. 구현 순서
1. 상태 컴포넌트(`Loading/Empty/Error`)
2. `SearchBar` + `FilterBar` + `ResultMeta`
3. `MapView` + `ComplexList`
4. 상세 컴포넌트
5. `StickyActionBar`

## 7. 완료 기준
1. 컴포넌트 재사용률(중복 제거) 확보
2. 페이지별 동일한 상태 처리 패턴 적용
3. 모바일/데스크탑 반응형 동작 확인
4. `lint/build` 통과

