# Vercel Deployment Checklist (Free -> Production) - budongsan-v2

- Version: v1.0
- Date: 2026-02-28
- Target: Vercel Hobby + Managed PostgreSQL (Free tier)

## 1) 배포 전 로컬 체크

1. 프로젝트 경로 확인
```powershell
cd C:\Users\Sam\Desktop\budongsan-v2
```

2. 린트/빌드 확인
```powershell
npm run lint
npm run build
```

3. 로컬 실행 확인
```powershell
npm run dev
```
- `http://localhost:3000` 접속
- `/api/deals?region=11680&sort=top` 응답 확인
- `/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5` 응답 확인

## 2) Git 연결

1. 저장소 초기화(미초기화 시)
```powershell
git init
git add .
git commit -m "chore: initial v2 baseline"
```

2. GitHub 원격 연결
```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## 3) Vercel 프로젝트 생성

1. Vercel 로그인 -> `Add New Project`
2. GitHub repo 선택: `budongsan-v2`
3. Framework: Next.js 자동 인식 확인
4. Build Command: `next build` (기본값)
5. Output: 기본값 사용

## 4) Vercel 환경변수 설정

Vercel Project Settings -> Environment Variables에 아래 등록:

1. `DATA_GO_KR_API_KEY`
2. `NEXT_PUBLIC_KAKAO_JS_KEY`
3. `NEXT_PUBLIC_BASE_URL` (`https://<your-domain>.vercel.app`)
4. `KV_REST_API_URL` (선택)
5. `KV_REST_API_TOKEN` (선택)

주의:
1. `NEXT_PUBLIC_*`는 브라우저에 노출됨
2. 비밀키는 `NEXT_PUBLIC_` 접두사 사용 금지

## 5) 배포 후 스모크 테스트

1. 메인 페이지 로딩
- `https://<your-domain>.vercel.app/`

2. API 테스트
- `https://<your-domain>.vercel.app/api/deals?region=11680&sort=top`
- `https://<your-domain>.vercel.app/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5`

3. 실패 시 우선 점검
1. 환경변수 누락
2. 공공 API 키 유효성
3. 카카오 도메인 등록(허용 도메인)

## 6) 무료 플랜 운영 가드레일

1. 외부 API 호출 캐시 적용 (revalidate/Redis)
2. API 응답 건수 제한 (`limit`, 최대건수)
3. 에러/타임아웃 로깅
4. 대용량 페이지네이션 필수
5. 불필요한 클라이언트 재호출 방지

## 7) 장애 대응 체크리스트

1. `deals`만 실패 -> 공공 API 상태/키 확인
2. 지도만 실패 -> 카카오 키/도메인 허용 확인
3. 전체 실패 -> Vercel Deployment 로그 확인
4. 간헐적 실패 -> 캐시 TTL 상향, 요청량 제한

## 8) 무료 -> 유료 전환 기준

아래 중 1개라도 충족하면 유료 전환 검토:
1. API p95가 목표 초과(지속)
2. 무료 DB/호스팅 한도 반복 초과
3. 운영 SLA(응답/가용성) 미달

우선 전환 순서:
1. DB 유료화 (가장 먼저 병목)
2. Redis 유료화
3. Vercel Pro

## 9) 일일 운영 루틴 (10분)

1. 배포 상태 확인
2. 핵심 API 2개 헬스체크
3. 오류 로그 확인
4. 전일 트래픽/응답시간 확인

## 10) 복붙용 최소 배포 명령

```powershell
cd C:\Users\Sam\Desktop\budongsan-v2
npm run lint
npm run build
git add .
git commit -m "deploy: ready for vercel"
git push
```

Vercel은 main push 시 자동 배포.
