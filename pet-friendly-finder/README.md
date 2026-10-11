# 우리 댕댕이랑 갈 곳 🐾

현재 위치 기준으로 반려견 동반 가능한 식당·카페를 찾아주는 앱인토스(토스 미니앱)입니다.

> `public/places/`에 변환된 공공데이터가 없으면 **샘플 데이터**(`src/data/samplePlaces.ts`, 가상 가게)로 동작해요.

## 실제 데이터 넣기

1. 공공데이터포털에서 [한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터](https://www.data.go.kr/data/15111389/fileData.do) CSV를 내려받아요.
2. 변환해요. 식당·카페만 골라 `public/places/`에 지역 격자(약 11km)별 JSON으로 나눠 저장해요.

   ```bash
   npm run data:convert -- ~/Downloads/파일이름.csv
   ```

3. 출력되는 **카테고리별 행 수**를 보고, 식당·카페가 제대로 분류됐는지 확인하세요. 분류 규칙은 `scripts/lib/transform.mjs`의 `classify`에 있어요.
4. `public/places/`를 커밋하면 앱이 자동으로 실제 데이터를 써요. 화면 하단에 출처가 표시돼요.

변환 규칙:

| 원본 컬럼 | 앱에서 |
|---|---|
| 카테고리1~3 | "카페/커피/베이커리" → 카페, "식당/음식/레스토랑" → 식당, 나머지는 제외 |
| 반려동물 동반 가능정보 | `N`이면 제외 |
| 입장 가능 동물 크기 | "모두 가능"·"대형" 또는 25kg 이상 허용이면 **대형견 가능** |
| 장소(실내)/(실외) 여부, 반려동물 제한사항 | 케이지·이동장 언급 → 케이지 필수, 실내 Y → 실내, 실외만 Y → 테라스, 둘 다 없으면 확인 필요 |
| 최종작성일 | 상세 화면의 "정보 작성일" |

공공누리 출처표시 조건이라 화면 하단에 출처를 표시하고 있어요. 데이터 원본의 이용 조건은 내려받을 때 한 번 더 확인하세요.

## 실행

```bash
npm install
npm test                     # 변환 규칙·격자 계산 테스트
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
| `src/lib/places.ts` | 위치 주변 격자의 데이터만 불러오기 (없으면 샘플) |
| `scripts/convert-places.mjs` | 공공데이터 CSV → `public/places/` 변환 |
| `src/data/samplePlaces.ts` | 샘플 데이터 |

## 다음 할 일

- [x] 공공데이터 변환기와 격자별 불러오기
- [ ] 실제 CSV 변환 결과 커밋
- [ ] TourAPI 반려동물 동반여행 데이터 추가
- [ ] "정보가 달라요" 제보 저장
- [ ] 토스 광고 연동
