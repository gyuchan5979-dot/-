# 매일 한 줄 📖

하루 한 문장, 저작권이 끝난 고전에서 고른 글귀를 보여주는 앱인토스(토스 미니앱)예요.

- 문장 모음: `src/data/lines.ts` (100개, 날짜 순서대로 돌아가요. 새 문장은 `AUTHORS`에 사망 연도와 함께 추가)
- 같은 날에는 누구에게나 같은 문장 (한국 시간 기준)
- 기록(읽은 날·연 날·간직한 문장)은 기기에만 저장 (토스 Storage / 브라우저 localStorage)
- 광고 ID는 `.env.production` (비어 있으면 광고 없이 동작)

```bash
npm install
npm run dev      # 개발 서버
npm test         # 테스트
npm run build    # daily-line.ait 만들기
```

콘솔 입력 정보는 `store/콘솔-입력정보.md`에 있어요.
