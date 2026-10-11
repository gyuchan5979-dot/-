# 우리 댕댕이랑 갈 곳 🐾

현재 위치 기준으로 반려견 동반 가능한 식당·카페를 찾아주는 앱인토스(토스 미니앱)입니다.

> 지금은 **샘플 데이터**(`src/data/samplePlaces.ts`, 가상 가게)로 동작해요. 출시 전에 실제 데이터로 바꿔야 해요.

## 실행

```bash
npm install
cp .env.example .env.local   # 지도 탭을 쓰려면 카카오맵 JavaScript 키 입력
npm run dev
```

- 토스 앱 안에서는 앱인토스 SDK `Device.getLocation`으로 위치를 받고, 일반 브라우저에서는 브라우저 위치 권한을 써요. 둘 다 안 되면 서울시청 기준으로 보여줘요.
- 카카오맵 키가 없으면 지도 탭에 안내 문구만 나오고, 목록 기능은 그대로 동작해요.
- 카카오 개발자 콘솔에서 JavaScript 키의 사이트 도메인에 `http://localhost:5173`과 실제 서비스 도메인을 등록해야 지도가 떠요.

## 앱인토스 배포

설정은 `apps-in-toss.config.ts`에 있어요. `appName`은 앱인토스 콘솔에 등록한 이름과 맞춰야 해요.

```bash
npm run build
npx ait build
npx ait deploy
```

## 구조

| 파일 | 역할 |
|---|---|
| `src/App.tsx` | 화면: 반경·조건 필터, 목록/지도 탭 |
| `src/lib/location.ts` | 위치 조회 (토스 SDK → 브라우저 → 기본 위치 순서로 시도) |
| `src/lib/geo.ts` | 거리 계산 |
| `src/components/KakaoMap.tsx` | 카카오맵 표시 |
| `src/components/PlaceDetail.tsx` | 상세 바텀시트, 카카오맵 길찾기 |
| `src/data/samplePlaces.ts` | 샘플 데이터 (실제 데이터로 교체 예정) |

## 다음 할 일

- [ ] 실제 데이터 연결 (문화빅데이터플랫폼 반려동물 동반 가능 시설, TourAPI 반려동물 동반여행)
- [ ] 서버에서 반경 검색 (가게 수가 많아지면 클라이언트 필터 대신 사용)
- [ ] "정보가 달라요" 제보 저장
- [ ] 토스 광고 연동
