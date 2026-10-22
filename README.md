# 런던커튼 홈페이지 관리 가이드 (londoncurtain.co.kr)

드리움 · 결앤빛과 **같은 구조**로 만들었습니다. 파일을 FTP로 그대로 올리면 됩니다.
(`README.md` 와 `_build/` 폴더는 업로드하지 않아도 됩니다.)

## 🚩 오픈 전에 꼭 바꿀 것

| 항목 | 위치 | 지금 값 |
|---|---|---|
| 전화번호 | `js/config.js` + `_build/common.py` 의 `PHONE` | ✅ 010-6394-6285 |
| 대표자 · 사업자번호 · 상호 | `js/config.js` | ✅ 송민영 · 431-71-00596 · 런던 커튼&블라인드 |
| 카카오 채널 주소 | `js/config.js` → `kakaoUrl` | ✅ pf.kakao.com/_FxlTmX |
| 문의 폼 | `js/config.js` → `formspreeId` | ✅ meaenjpn (친구 메일로 수신) |
| 이메일 | `js/config.js` → `email` | 비어 있음 (푸터에서 숨김) |
| 사진 | 아래 "사진 교체" 참고 | 자리표시용 |

> 전화번호를 바꿀 때는 `_build/common.py` 의 `PHONE` 을 바꾸고 `python3 _build/build.py` 를 실행하세요.
> (검색엔진용 업체 정보에도 번호가 들어 있어서 `config.js` 만 바꾸면 부족합니다)

## 폴더 구조

```
/index.html                 메인
/area-xxx.html              지역 페이지 62개
   ├ 남양주 11개: 진접(본점) · 오남 · 별내 · 다산 · 호평 · 평내 · 화도 · 와부덕소 · 진건퇴계원 · 왕숙신도시 · 남양주 전체
   ├ 진접 인접 5개: 포천 · 의정부 · 구리 · 양주 · 가평
   ├ 서울 25개 구
   └ 경기 21개: 하남 · 분당판교 · 일산 · 수원 · 용인 · 동탄 · 평촌 · 산본 · 의왕 · 과천 · 광명 · 부천 · 시흥 · 안산 · 김포 · 파주 · 광주 · 이천 · 양평 · 오산 · 평택
/areas.html                 시공 지역 목록
/blog.html, blog-N-xxx.html 매거진 14편
/gallery.html, case-01~06   시공사례 (지금은 예시 — 아래 참고)
/products.html              제품 안내 (#linen #chiffon #blackout #combi #wood #honeycomb #roll #motor)
/about.html  /faq.html  /inquiry.html  /thanks.html
/css/  /js/config.js(★연락처)  /js/includes.js(헤더·푸터)  /js/main.js
/sitemap.xml  /rss.xml  /robots.txt  /.htaccess
/_build/                    페이지 생성기 (업로드 불필요)
```

## 남양주 진접 검색 강화 — 이렇게 되어 있습니다

- **메인 제목 · 설명**에 "남양주 진접 커튼 · 블라인드"를 가장 앞에 배치
- **진접 페이지(area-jinjeop.html)를 본점 페이지로**: 장현리 · 부평리 · 금곡리 등 법정리 이름, 진접역, 광릉숲 전원주택, 왕숙신도시 입주 이야기를 담고 지역 FAQ(구조화 데이터)를 넣음
- **남양주를 동네 단위로 11개 페이지**로 쪼개서 "오남 커튼", "별내 블라인드", "다산 커튼", "호평동 커튼", "왕숙신도시 커튼" 같은 검색어를 각각 노리게 함
- 모든 지역 페이지에 **"진접 본점 안내 →" 링크**를 넣어 진접 페이지로 내부 링크가 모이게 함
- 메인에 **남양주 동네 바로가기 섹션**과 **전체 지역 링크**를 HTML로 넣어 네이버 로봇이 바로 따라갈 수 있게 함
- 업체 구조화 데이터의 소재지 = **경기도 남양주시 진접읍**
- 매거진 글 중 입주 준비 · 업체 고르는 법 · 통창 커튼 글은 남양주 지역 페이지로 연결

### 검색 노출에 가장 큰 영향을 주는 것 (홈페이지 밖)
1. **네이버 스마트플레이스 등록** (진접 주소로) — "진접 커튼" 같은 지역 검색은 지도 · 플레이스가 맨 위에 나옵니다.
   등록 후 플레이스 주소를 `config.js` → `naverPlaceUrl` 에 넣으면 "네이버 리뷰 보기" 버튼이 생깁니다.
2. **구글 비즈니스 프로필** 등록 (같은 상호 · 주소 · 전화번호로)
3. 플레이스 · 홈페이지 · 블로그의 **상호 · 전화번호 · 주소를 똑같이** 유지

## 검색엔진 등록 순서

1. **네이버 서치어드바이저** (searchadvisor.naver.com) → 사이트 등록 → HTML 태그 인증
   → 받은 `<meta name="naver-site-verification" ...>` 를 `index.html` 의 `<head>` 주석 자리에 붙여넣기
2. 서치어드바이저 → 요청 → **사이트맵 제출**: `https://londoncurtain.co.kr/sitemap.xml`
3. 서치어드바이저 → 요청 → **RSS 제출**: `https://londoncurtain.co.kr/rss.xml` (매거진 글 수집이 빨라짐)
4. **구글 서치콘솔**도 같은 방식으로 인증 + 사이트맵 제출
5. 새 페이지를 추가할 때마다 sitemap.xml 갱신 → 서치어드바이저 "웹 페이지 수집 요청"

이미 들어 있는 것: 페이지별 title · description · keywords, canonical, OG(카톡 공유 미리보기 이미지 포함),
구조화 데이터(업체 정보 · FAQ · 게시글 · 경로), sitemap.xml, rss.xml, robots.txt, https · www 통일(.htaccess), 모바일 대응.

## 사진 교체 (가장 먼저 할 일)

지금 사진은 **자리표시용**이고, 사진 위에 파일명과 권장 크기가 적혀 있습니다.
**같은 파일명으로 FTP에 덮어쓰기**하면 바로 바뀝니다. (장당 300KB 이하 권장)

| 폴더 | 파일 | 권장 크기 |
|---|---|---|
| `images/hero/` | hero-01~03.jpg (메인 슬라이드) | 1920×1080 |
| `images/hero/` | hero-gallery / products / areas / blog / about / faq / inquiry / cta .jpg | 1920×1080 |
| `images/cases/` | case-01.jpg (대표), case-01-2.jpg … case-06 | 1600×1200 |
| `images/products/` | linen, chiffon, blackout, combi, wood, honeycomb, roll, motor .jpg | 900×1200 (세로) |
| `images/before-after/` | before-slide.jpg, after-slide.jpg (**같은 위치 · 구도**) | 1440×1122 |
| `images/about/` | about-01.jpg, about-02.jpg | 1000×1250 (세로) |
| `images/og-image.jpg` | 카톡 · SNS 공유 미리보기 (완성본 들어 있음) | 1200×630 |

> 제품 사진은 매거진 글과 지역 페이지에도 같이 쓰입니다. 사진만 바꾸면 전체에 반영돼요.
> 사진을 바꾼 뒤 예전 사진이 계속 보이면 `_build/common.py` 의 `VER` 숫자를 올리고 다시 생성하세요.

## 사진 (실제 시공 사진 반영됨)

- 받은 원본은 `_build/photos-src/` (위치 정보 삭제), 분류 메모는 `_build/photos-src/NOTES.md`
- `python3 _build/photos.py` 를 실행하면 메인 슬라이드 · 페이지 배경 · 제품 · 시공사례 사진을 원본에서 다시 잘라 만듭니다.
  (창밖 아파트 이름 등은 이 스크립트에서 흐림 처리)
- **시공사례 39개(case-01~39)** 는 실제 사진이고, 본문은 사진에서 보이는 내용만 적었습니다.
  지역 · 평수를 알게 되면 `_build/build.py` 의 `CASES` 에서 `space` 를 "남양주 진접 · 34평 거실"처럼 바꾸면 지역 검색에 크게 도움이 됩니다.
- 메인의 비교 슬라이더는 시공 전 사진이 없어 **우드 블라인드 열었을 때 / 닫았을 때**로 구성했습니다.
- **고객 후기**는 비워 두었습니다. 실제 후기가 생기면 `index.html` 후기 영역 주석의 형식대로 추가하세요.
- **브랜드 소개(about.html)** 문구는 초안입니다.

## 새 페이지 추가

**생성기 사용 (권장)** — `_build/` 의 데이터 파일을 고치고 `python3 _build/build.py` 실행
- 지역 추가: `_build/areas_data.py` 에 한 덩어리 추가 (소개 글은 지역마다 **다르게**)
- 매거진 글 추가: `_build/posts_data.py` 에 한 덩어리 추가
- 헤더 · 푸터 · 지역 목록(`js/includes.js`), sitemap, rss 가 자동으로 같이 갱신됩니다.
- 사진 자리표시: `python3 _build/placeholders.py` (이미 있는 사진은 건드리지 않음)

**직접 수정** — 기존 html 하나를 복사해 내용 수정 → `sitemap.xml` 에 주소 추가

## 드리움 · 결앤빛과 함께 운영할 때 주의

세 사이트가 비슷한 문장을 쓰면 네이버가 유사 문서로 보고 한쪽만 노출할 수 있습니다.
런던커튼의 문구는 처음부터 새로 썼고, 결앤빛과는 **겹치는 문장이 없는 것을 자동 비교로 확인**했습니다.
앞으로 글을 추가할 때도 다른 사이트 글을 복사하지 말고 새로 써 주세요. 사진도 사이트마다 다른 사진을 쓰는 것이 좋습니다.
