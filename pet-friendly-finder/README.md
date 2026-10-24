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
4. 원본에서 고른 결과는 `data/sources/kcisa.json`에도 저장돼요. `public/places/`를 커밋하면 앱이 자동으로 실제 데이터를 써요. 화면 하단에 출처가 표시돼요.

변환 규칙:

| 원본 컬럼 | 앱에서 |
|---|---|
| 카테고리3 (없으면 카테고리2) | 카페 → 카페, 식당 → 식당, 나머지(동물병원·약국·용품 등)는 제외 |
| 시설명 | 고양이·라쿤 카페(고양이/캣/냥/라쿤 등)는 제외. 단, 이름에 강아지 관련 단어도 있으면 남겨요 |
| 반려동물 동반 가능정보 | `N`이면 제외 |
| 입장 가능 동물 크기 | "모두 가능" 또는 25kg 이상 허용이면 **대형견 가능**. 제한사항에 "대형견 불가"가 있으면 불가 |
| 반려동물 제한사항, 장소(실내)/(실외) 여부 | 케이지·이동장·"안고" → 케이지 필수, "실외/야외/테라스…만" → 테라스, 그 외 실내 Y → 실내 |
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
- 카카오맵 JavaScript 키는 `.env.production`에 들어 있어요(공개용 키, 카카오 콘솔에 등록한 토스 도메인에서만 동작). 키가 없으면 지도 탭이 숨겨지고 목록만 보여요.
- 카카오 콘솔에 등록된 도메인: `https://pet-friendly-finder.apps.tossmini.com`(실서비스), `https://pet-friendly-finder.private-apps.tossmini.com`(토스앱 테스트). 로컬(localhost)에서는 지도가 뜨지 않아요(필요하면 개발용으로 `http://localhost:5173`을 추가 등록).

## 식약처 등록 업소 (가장 최신·공식)

2026년 3월 시행된 「반려동물 동반출입 음식점」 제도로 지자체에 등록한 업소 목록이에요. 식품안전나라 [반려동물 동반 가능 업소 현황](https://www.foodsafetykorea.go.kr/portal/petKorea.do) 페이지의 표(업소명·업종·주소)를 읽어요. 앱에서는 **✓ 식약처 등록** 배지로 표시하고, 같은 가게가 여러 출처에 있으면 이 정보를 가장 우선해요.

```bash
npm run data:fsk                         # 키 없이: OSM Nominatim (초당 1건, 번지까지 맞은 주소만 사용)
KAKAO_REST_KEY='키' npm run data:fsk     # 카카오 주소 검색: 더 많이·정확하게
```

- 목록에 좌표가 없어서 주소를 좌표로 바꿔요. 결과는 `data/geocode-cache.json`에 저장돼서, 다시 실행하면 새로 추가된 업소만 변환해요.
- Nominatim은 "○○로 607"을 "○○로" 도로 전체로 찾는 경우가 많아서(핀이 수 km 틀어짐), 번지·건물까지 맞은 결과만 써요. 그래서 일부 업소는 빠져요. 카카오 키로 다시 실행하면 빠진 업소를 채워요.
- 목록에는 크기 제한 같은 조건이 없어서 "가게에 문의"로 표시해요.
- 클라우드 환경 등 프록시 뒤에서 실행할 때는 `NODE_USE_ENV_PROXY=1`을 앞에 붙이세요.

## 한국관광공사 데이터 추가 (TourAPI)

한국관광공사 「반려동물 동반여행 서비스」에서 음식점(카페 포함)을 받아 합쳐요.

1. 공공데이터포털 [한국관광공사_반려동물_동반여행_서비스](https://www.data.go.kr/data/15135102/openapi.do)에서 **활용신청** (개발계정은 자동승인, 하루 1,000회)
2. 마이페이지에서 **일반 인증키(Decoding)** 를 복사해서 실행:

   ```bash
   TOUR_API_KEY='발급받은키' npm run data:tourapi
   ```

3. 가게마다 상세 조회를 한 번씩 해서 호출이 많아요. 한도에 걸리면 받은 만큼 `data/cache/`에 저장하고 멈추니, 다음 날 같은 명령을 다시 실행하면 이어서 받아요.
4. 결과는 `data/sources/tourapi.json`에 저장되고 `public/places/`가 다시 만들어져요. 같은 가게(80m 안, 이름 같음)는 한국관광공사 정보를 우선해요.

> 이 API는 실제 키로 아직 실행해 보지 못했어요. 명세(Swagger)의 필드 이름으로 만들었으니, 처음 실행할 때 결과 개수와 "제외" 사유를 꼭 확인하세요.

## 사용자 제보 (Supabase)

"정보가 달라요" 신고와 "+ 장소 제보"는 Supabase(무료 플랜으로 충분)에 저장해요. 설정하지 않으면 제보 버튼이 숨겨지거나 "준비 중"으로 나와요.

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에 `supabase/schema.sql` 내용을 붙여 넣고 실행
3. Project Settings → API의 **Project URL**과 **anon public 키**를 `.env.local`에 넣기

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

운영 방법 (Supabase 대시보드 → Table Editor):

- `place_submissions`: 새 장소 제보. `status`를 `approved`로 바꾸면 앱에 바로 나타나요 (`verified_at`에 확인한 날짜를 넣으면 "정보 작성일"로 표시돼요). 이상한 제보는 `rejected`.
- `place_reports`: 기존 가게 신고. `place_id`로 가게를 찾고, 폐업·동반 불가가 여러 건 쌓이면 데이터에서 빼 주세요. 처리하면 `status`를 `resolved`로.

보안: 앱(anon 키)은 제보 **추가**와 승인된 제보 **읽기**만 할 수 있어요. 직접 승인하거나, 신고 내용·다른 사람의 키를 읽거나, 같은 날 같은 제보를 반복할 수 없어요. 사용자는 토스 익명 키(토스 앱 밖에서는 기기별 임의 값)로만 구분해요.

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
| `scripts/convert-places.mjs` | 한국문화정보원 CSV → `data/sources/kcisa.json` |
| `scripts/fetch-fsk.mjs` | 식약처 등록 업소 → 좌표 변환 → `data/sources/fsk.json` |
| `scripts/fetch-tourapi.mjs` | 한국관광공사 API → `data/sources/tourapi.json` |
| `scripts/build-places.mjs` | `data/sources/*` 합치고 중복 제거 → `public/places/` |
| `src/lib/reports.ts`, `supabase/schema.sql` | 사용자 제보 저장·조회 |
| `src/data/samplePlaces.ts` | 샘플 데이터 |

## 다음 할 일

- [x] 공공데이터 변환기와 격자별 불러오기
- [x] 실제 CSV 변환 결과 커밋 (2025-03-24판 → 식당·카페 821곳)
- [ ] 데이터 보강: 대부분 2022-11 작성이고 식당이 15곳뿐이라, 사용자 제보·다른 출처가 필요해요
- [x] "정보가 달라요" 신고와 새 장소 제보 (Supabase)
- [x] 식약처 등록 업소 추가
- [x] 카카오 주소 검색으로 식약처 등록 업소 2,800곳 좌표 변환
- [ ] TourAPI 키 발급 후 `npm run data:tourapi` 실행
- [ ] Supabase 프로젝트 만들고 키 연결
- [ ] 토스 광고 연동
