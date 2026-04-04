# SALJIP Hub Manual Smoke Result Template (Auto PASS/FAIL)

## 사용법
수동 실행 후 아래 명령으로 결과 리포트를 자동 생성합니다.

```bash
npm run qa:hub-manual-report -- \
  --tc01=pass \
  --tc02=pass \
  --tc03=pass \
  --tc04=pass \
  --tc05=pass
```

생성 파일:
- `notes/hub-manual-smoke-result-YYYY-MM-DD.md`

생성 후 벤치마크 체크리스트 자동 반영:
```bash
npm run qa:sync-benchmark-smoke -- --date=YYYY-MM-DD
```

## 파라미터
- `--tc01`, `--tc02`, `--tc03`, `--tc04`, `--tc05`
  - 허용값: `pass | fail | 미입력(미실행)`
- 선택 메타
  - `--executor=Sam`
  - `--browser=Chrome`
  - `--resolution="Desktop 1440px+"`
  - `--baseUrl=http://localhost:3000`
  - `--date=2026-04-04`
- 선택 비고
  - `--tc01Note="수동 이동 후 리셋 없음"`
  - `--tc02Note="저줌에서도 클릭 가능"`

## 판정 규칙
- 하나라도 `FAIL`이면 최종 `FAIL`
- 전부 `PASS`면 최종 `PASS`
- `미실행`이 남아 있으면 최종 `미완료`

## 예시 (부분 미실행)
```bash
npm run qa:hub-manual-report -- \
  --tc01=pass --tc01Note="자동 줌인 1회 확인" \
  --tc02=pass \
  --tc03=pass \
  --tc04=fail --tc04Note="일부 단지에서 패널 선택 후 이동 지연" \
  --tc05=pass
```
