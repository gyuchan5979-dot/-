"""런던커튼 사이트 생성.

실행: python3 _build/build.py   (저장소 루트 또는 어디서든)
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (SITE, DOMAIN, BRAND, BRAND_EN, PHONE, TODAY, VER, PRODUCTS, esc, v,
                    page, business_ld, faq_ld, product_card)
from areas_data import AREAS, GROUPS, BY_SLUG as AREA
from posts_data import POSTS, BY_SLUG as POST

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
written = []


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)
    written.append(path)


def area_file(a):
    return f"area-{a['slug']}.html"


def date_dot(d):
    return d.replace("-", ".")


# ---------------------------------------------------------------
# 시공사례 (예시 6개 — 실제 사진으로 바꾸기 전까지 검색 제외)
# ---------------------------------------------------------------
CASES = [
    dict(no="01", cat="curtain", space="거실", product="린넨 겉커튼 + 쉬폰", spec="린넨 겉커튼 + 화이트 쉬폰 (이중 레일)",
         title="린넨 겉커튼과 쉬폰으로 완성한 거실",
         text="거실 창에 린넨 겉커튼과 화이트 쉬폰 속커튼을 이중 레일로 구성한 예시입니다. 낮에는 쉬폰만 쳐서 햇빛을 부드럽게 거르고, 저녁에는 겉커튼을 닫아 아늑하게 쓰는 가장 기본적인 거실 구성이에요.",
         points=["레일을 창 양옆으로 넉넉히 빼서 커튼을 열었을 때 창을 가리지 않게", "바닥에서 1cm 정도 띄운 길이로 깔끔하게", "마루 톤에 맞춘 오트밀 계열 린넨"]),
    dict(no="02", cat="curtain", space="안방", product="암막 커튼", spec="삼중직 암막 커튼 + 쉬폰",
         title="새벽빛을 막은 안방 암막 커튼",
         text="안방 창에 암막 겉커튼과 쉬폰을 함께 단 예시입니다. 레일 위쪽 틈과 양옆으로 새는 빛을 줄이도록 커튼박스 안에 설치하고 폭을 넉넉하게 잡는 구성이에요.",
         points=["커튼박스 안 설치로 위쪽 빛샘 줄이기", "창보다 넓은 폭으로 양옆 빛샘 줄이기", "바닥에 살짝 닿는 길이"]),
    dict(no="03", cat="blind", space="거실", product="콤비 블라인드", spec="화이트 콤비 블라인드",
         title="밝기를 자유롭게 조절하는 거실 콤비 블라인드",
         text="거실 창에 화이트 콤비 블라인드를 단 예시입니다. 줄 하나로 망사 원단과 막힌 원단을 겹쳐 밝기를 조절할 수 있어, 신축 입주 때 가장 많이 선택하는 구성이에요.",
         points=["창틀 안쪽에 맞춘 깔끔한 일자 라인", "벽 색에 맞춘 화이트 원단", "조작줄 안전 고리 설치"]),
    dict(no="04", cat="blind", space="서재", product="우드 블라인드", spec="오크 우드 블라인드 50mm",
         title="책상 앞 눈부심을 줄인 서재 우드 블라인드",
         text="서재 창에 오크 톤 우드 블라인드를 단 예시입니다. 슬랫 각도로 빛을 천장 쪽으로 튕겨 방은 밝게 두면서 모니터와 책상 위 눈부심만 줄이는 구성이에요.",
         points=["원목 가구와 맞춘 오크 컬러", "넓은 창은 두 개로 나눠 무게 분산", "슬랫 각도 조절로 빛 방향 조절"]),
    dict(no="05", cat="blind", space="아이방", product="암막 롤스크린", spec="암막 롤스크린 + 안전 고리",
         title="낮잠 시간을 지켜 주는 아이방 암막 롤스크린",
         text="아이방 창에 암막 롤스크린을 단 예시입니다. 낮잠 시간에도 방을 어둡게 만들고, 조작줄은 아이 손이 닿지 않게 안전 고리로 정리하는 구성이에요.",
         points=["빛을 막는 암막 원단", "조작줄 안전 고리로 높게 정리", "차분한 톤으로 오래 쓰도록"]),
    dict(no="06", cat="curtain motor", space="전원주택 거실", product="전동 커튼", spec="전동 레일 + 린넨 웨이브 커튼",
         title="높은 창을 버튼 하나로, 전원주택 전동 커튼",
         text="층고가 높은 전원주택 거실 창에 전동 레일과 웨이브 주름 커튼을 단 예시입니다. 손이 닿지 않는 높이의 창도 리모컨으로 여닫을 수 있고, 예약 기능으로 아침저녁 자동 개폐도 가능합니다.",
         points=["전원 위치를 미리 확인해 선이 보이지 않게", "웨이브 주름으로 정돈된 실루엣", "리모컨 · 예약 개폐"]),
]


def case_card(c, cls="case-card", extra=""):
    return f'''                <a href="case-{c["no"]}.html" class="{cls}{extra}" data-cat="{c["cat"]}">
                    <div class="case-img">
                        <img src="{v(f'images/cases/case-{c["no"]}.jpg')}" alt="{c["space"]} {c["product"]} 시공 사진" loading="lazy">
                        <span class="case-badge">{c["product"]}</span>
                    </div>
                    <div class="case-info">
                        <span class="case-loc">{c["space"]} · {c["product"]}</span>
                        <h3>{c["title"]}</h3>
                    </div>
                </a>
'''


def post_card(p):
    return f'''                <a href="{p["slug"]}.html" class="post-card">
                    <div class="post-img"><img src="{v('images/products/' + p['img'] + '.jpg')}" alt="{esc(p["title"])}" loading="lazy"></div>
                    <span class="post-cat">{p["cat"]}</span>
                    <h3>{p["title"]}</h3>
                    <p>{p["desc"]}</p>
                    <span class="post-date">{date_dot(TODAY)}</span>
                </a>
'''


# ---------------------------------------------------------------
# 메인
# ---------------------------------------------------------------
HOME_FAQ = [
    ("방문 실측과 상담은 무료인가요?",
     "네. 남양주는 물론 서울 · 경기 지역은 출장비와 상담비 없이 원단 샘플을 들고 방문해 실측과 견적을 드립니다. 견적만 받아 보셔도 괜찮아요."),
    ("런던커튼은 어디에 있나요?",
     "경기 남양주시 진접읍에 있습니다. 진접 · 오남 · 별내 · 다산 등 남양주 전 지역은 가까워 일정 조율과 A/S가 특히 빠릅니다."),
    ("주문하면 언제 달 수 있나요?",
     "실측 후 맞춤 제작에 보통 일주일 안팎이 걸립니다. 입주나 이사 날짜가 정해져 있다면 상담 때 먼저 알려 주세요. 날짜에 맞춰 일정을 잡아 드립니다."),
    ("신축 아파트 사전점검 때 실측할 수 있나요?",
     "가능하고, 가장 권해 드리는 방법입니다. 사전점검 날 실측을 마치면 입주일에 맞춰 바로 설치할 수 있어요."),
]


def build_index():
    near_links = ["jinjeop", "onam", "byeollae", "dasan", "hopyeong", "pyeongnae",
                  "hwado", "deokso", "jingeon", "wangsuk", "pocheon", "uijeongbu"]
    sub = {"jinjeop": "장현 · 부평 · 금곡", "onam": "오남역 · 양지리", "byeollae": "신도시 · 별내면",
           "dasan": "진건 · 지금지구", "hopyeong": "호평지구", "pyeongnae": "평내호평역",
           "hwado": "마석 · 북한강", "deokso": "덕소역 · 한강변", "jingeon": "사릉 · 퇴계원",
           "wangsuk": "입주 준비", "pocheon": "소흘 · 송우리", "uijeongbu": "민락 · 고산"}
    local_map = "".join(
        f'                    <a href="{area_file(AREA[s])}"{" class=\"is-home\"" if AREA[s].get("base") else ""}><strong>{AREA[s]["name"]}</strong><small>{sub[s]}</small></a>\n'
        for s in near_links)

    quick = ""
    for g, label in GROUPS:
        links = " ".join(f'<a href="{area_file(a)}">{a["name"]}</a>' for a in AREAS if a["group"] == g)
        quick += f'                <div><h3>{label}</h3><p>{links}</p></div>\n'

    slides_note = ""
    body = f'''    <!-- ===== 메인 히어로: 배경 사진은 js/includes.js 의 HOME_HERO_SLIDES 에서 관리 ===== -->
    <section class="hero" data-hero="home">
        <p class="hero-badge" aria-hidden="true">EST. NAMYANGJU JINJEOP</p>
        <div class="container hero-content">
            <p class="hero-eyebrow">LONDON CURTAIN · CURTAIN &amp; BLIND</p>
            <h1><span class="hero-kicker">남양주 진접 커튼 · 블라인드 맞춤 시공</span>창가에 오래 머무는<br>단정한 아름다움</h1>
            <p class="hero-sub">남양주 진접에서 시작해 서울 · 경기 어디든 찾아갑니다.<br>원단 샘플을 들고 가는 무료 방문 실측</p>
            <div class="hero-buttons">
                <a href="inquiry.html" class="btn btn-light">무료 방문 견적 <span class="arrow">→</span></a>
                <a href="area-jinjeop.html" class="btn btn-outline-white">진접 · 남양주 시공 안내</a>
            </div>
        </div>
    </section>

    <!-- ===== 약속 띠 ===== -->
    <section class="promise">
        <div class="promise-grid">
            <div class="promise-item"><span class="num">01</span><strong>무료 방문 실측</strong><p>원단 샘플을 들고 직접 찾아갑니다</p></div>
            <div class="promise-item"><span class="num">02</span><strong>진접 본점 · 빠른 A/S</strong><p>남양주는 가까워 언제든 다시 들러요</p></div>
            <div class="promise-item"><span class="num">03</span><strong>창마다 맞춤 제작</strong><p>기성품이 아닌 우리 집 치수로</p></div>
            <div class="promise-item"><span class="num">04</span><strong>항목별 견적</strong><p>원단 · 레일 · 시공비를 나눠서 안내</p></div>
        </div>
    </section>

    <!-- ===== 남양주 진접 (지역 검색 강화: 남양주 동네별 페이지로 바로 연결) ===== -->
    <section class="section bg-ink">
        <div class="container local-band">
            <div class="reveal">
                <p class="section-tag">NAMYANGJU · JINJEOP</p>
                <h2>남양주 진접에서<br>시작한 커튼 집</h2>
                <p>런던커튼은 경기 남양주시 진접읍에 자리하고 있습니다. 진접 · 오남 · 별내 · 다산 · 호평 · 평내 · 화도 · 와부 · 진건 · 퇴계원, 그리고 입주를 앞둔 왕숙신도시까지 남양주 곳곳을 직접 다닙니다.</p>
                <p>가까운 동네는 실측 일정이 유연하고, 시공 뒤에 손볼 일이 생겨도 금방 들를 수 있어요. 서울 25개 구와 경기 대부분 지역도 같은 방식으로 방문합니다.</p>
                <a href="area-namyangju.html" class="btn btn-brass">남양주 시공 안내 <span class="arrow">→</span></a>
            </div>
            <nav class="local-map reveal d1" aria-label="남양주 · 진접 인근 시공 지역">
{local_map}            </nav>
        </div>
    </section>

    <!-- ===== 시공사례 (사진 교체 전 예시 — README 참고) ===== -->
    <section class="section">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">WORKS</p>
                    <h2 class="section-title">시공 사례</h2>
                    <p class="section-sub">공간별로 많이 찾는 구성을 사례로 정리했습니다.</p>
                </div>
                <a href="gallery.html" class="link-more">전체 사례 보기 →</a>
            </div>
            <div class="case-grid">
{case_card(CASES[0], extra=" wide reveal")}{case_card(CASES[1], extra=" reveal d1")}{case_card(CASES[2], extra=" reveal")}{case_card(CASES[3], extra=" reveal d1")}{case_card(CASES[5], extra=" reveal d2")}            </div>
        </div>
    </section>

    <!-- ===== 비포 & 애프터 (사진: images/before-after/before-slide.jpg, after-slide.jpg — 같은 크기 · 같은 구도) ===== -->
    <section class="section bg-sand">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">BEFORE &amp; AFTER</p>
                    <h2 class="section-title">커튼을 달기 전과 후</h2>
                    <p class="section-sub">가운데 선을 좌우로 움직여 비교해 보세요.</p>
                </div>
                <a href="case-01.html" class="link-more">이 사례 자세히 →</a>
            </div>
            <div class="ba-slider reveal">
                <img src="{v('images/before-after/before-slide.jpg')}" alt="커튼 시공 전 빈 거실 창" loading="lazy">
                <img src="{v('images/before-after/after-slide.jpg')}" alt="린넨 겉커튼과 쉬폰 시공 후 거실" class="ba-after" loading="lazy">
                <span class="ba-label before">BEFORE</span>
                <span class="ba-label after">AFTER</span>
                <div class="ba-handle"></div>
                <input type="range" min="0" max="100" value="50" class="ba-range" aria-label="시공 전후 비교 슬라이더">
            </div>
        </div>
    </section>

    <!-- ===== 제품 컬렉션 ===== -->
    <section class="section">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">COLLECTION</p>
                    <h2 class="section-title">창마다 어울리는 제품</h2>
                    <p class="section-sub">옆으로 넘겨 8가지 제품을 확인하세요.</p>
                </div>
                <a href="products.html" class="link-more">제품 전체 보기 →</a>
            </div>
            <div class="product-rail reveal">
{"".join(product_card(k) for k in PRODUCTS)}            </div>
        </div>
    </section>

    <!-- ===== 브랜드 이야기 ===== -->
    <section class="section bg-paper">
        <div class="container split">
            <div class="split-img reveal"><img src="{v('images/about/about-01.jpg')}" alt="창가에 원단 샘플을 대 보는 상담 모습" loading="lazy"></div>
            <div class="split-text reveal d1">
                <p class="section-tag">WHY LONDON</p>
                <h2>유행보다 오래 가는<br>창가를 만듭니다</h2>
                <p>커튼과 블라인드는 한 번 달면 몇 년을 함께하는 물건입니다. 그래서 런던커튼은 화려한 유행보다 그 집의 빛과 구조에 맞는 구성을 먼저 생각합니다.</p>
                <p>상담은 늘 고객님 집 창가에서 시작해요. 원단 샘플을 직접 창에 대 보고, 낮과 밤의 빛을 함께 떠올리며 고르도록 돕고, <strong>창마다 직접 재서 맞춤으로 제작</strong>합니다.</p>
                <a href="about.html" class="btn btn-outline">런던커튼 이야기 <span class="arrow">→</span></a>
            </div>
        </div>
    </section>

    <!-- ===== 진행 과정 ===== -->
    <section class="section">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">PROCESS</p>
                    <h2 class="section-title">상담부터 설치까지</h2>
                </div>
            </div>
            <div class="process-list reveal">
                <div class="process-item"><span class="step">STEP 01</span><h3>상담 신청</h3><p>전화 · 카톡 · 온라인으로 편하게 신청하세요. 창문 사진이나 평면도가 있으면 상담이 빨라집니다.</p></div>
                <div class="process-item"><span class="step">STEP 02</span><h3>방문 실측</h3><p>원단 샘플을 들고 찾아가 창마다 직접 재고, 빛이 드는 방향을 보며 함께 고릅니다.</p></div>
                <div class="process-item"><span class="step">STEP 03</span><h3>맞춤 제작</h3><p>정한 원단과 치수로 제작합니다. 입주 · 이사 날짜가 있다면 그 일정에 맞춰요.</p></div>
                <div class="process-item"><span class="step">STEP 04</span><h3>설치 · 마무리</h3><p>레일과 길이를 꼼꼼히 맞춰 설치하고 주변 정리까지 마칩니다. 이후 A/S도 책임집니다.</p></div>
            </div>
        </div>
    </section>

    <!-- ===== 시공 지역 바로가기 (검색엔진이 지역 페이지를 찾을 수 있도록 HTML 링크로 둠) ===== -->
    <section class="section bg-sand">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">SERVICE AREA</p>
                    <h2 class="section-title">남양주 · 서울 · 경기 시공 지역</h2>
                    <p class="section-sub">지역을 누르면 동네별 안내를 볼 수 있어요.</p>
                </div>
                <a href="areas.html" class="link-more">시공 지역 전체 →</a>
            </div>
            <div class="area-quick reveal">
{quick}            </div>
        </div>
    </section>

    <!-- ===== 고객 후기 =====
         후기가 생기면 아래 review-empty 를 지우고 이 형식으로 추가하세요. (실제 후기만 올려 주세요)
         <div class="review-grid">
             <div class="review-card">
                 <p class="stars" aria-label="별점 5점">★★★★★</p>
                 <p class="quote">"후기 내용"</p>
                 <p class="meta">김OO 고객님 · 남양주 진접 · 암막커튼</p>
             </div>
         </div>
    -->
    <section class="section">
        <div class="container">
            <div class="section-head center reveal">
                <p class="section-tag">REVIEW</p>
                <h2 class="section-title">고객 후기</h2>
            </div>
            <div class="review-empty reveal">
                <p>시공받으신 고객님들의 후기를 모으고 있습니다.<br>네이버와 카카오톡에 남겨 주신 후기를 이곳에도 차례로 소개할게요.</p>
                <div class="btn-row">
                    <a href="#" class="btn btn-outline" data-link="naver">네이버 리뷰 보기</a>
                    <a href="#" class="btn btn-kakao">카카오톡으로 문의하기</a>
                    <a href="inquiry.html" class="btn btn-primary">무료 견적 신청</a>
                </div>
            </div>
        </div>
    </section>

    <!-- ===== FAQ 미리보기 ===== -->
    <section class="section bg-paper">
        <div class="container-narrow">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">FAQ</p>
                    <h2 class="section-title">자주 받는 질문</h2>
                </div>
                <a href="faq.html" class="link-more">질문 더 보기 →</a>
            </div>
            <div class="faq-list reveal">
{faq_items(HOME_FAQ)}            </div>
        </div>
    </section>

    <!-- ===== 매거진 ===== -->
    <section class="section">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">MAGAZINE</p>
                    <h2 class="section-title">고르기 전에 읽어 보세요</h2>
                </div>
                <a href="blog.html" class="link-more">매거진 전체 →</a>
            </div>
            <div class="post-grid reveal">
{post_card(POST["blog-1-move-in-schedule"])}{post_card(POST["blog-2-choose-shop"])}{post_card(POST["blog-14-big-window"])}            </div>
        </div>
    </section>
'''
    title = "런던커튼 | 남양주 진접 커튼 · 블라인드 맞춤 시공 · 서울 경기 무료 실측"
    desc = "남양주 진접에 자리한 커튼 · 블라인드 맞춤 시공 런던커튼. 진접 · 오남 · 별내 · 다산 · 왕숙신도시 등 남양주 전 지역과 서울 · 경기 무료 방문 실측. 린넨 · 암막커튼, 콤비 · 우드 · 허니콤 블라인드, 전동커튼."
    kw = "런던커튼, 남양주 커튼, 진접 커튼, 남양주 블라인드, 진접 블라인드, 커튼 시공, 블라인드 시공, 암막커튼, 콤비블라인드, 우드블라인드, 허니콤블라인드, 전동커튼, 서울 커튼, 경기 커튼, 왕숙신도시 커튼"
    lds = [business_ld(), {"@context": "https://schema.org", "@type": "WebSite", "name": BRAND,
                           "alternateName": BRAND_EN, "url": SITE + "/"}]
    write("index.html", page("index.html", title, desc, kw, body, lds=lds, verify=True))


def faq_items(pairs, indent="                "):
    out = ""
    for q, a in pairs:
        out += (f'{indent}<details class="faq-item">\n'
                f'{indent}    <summary>{q}</summary>\n'
                f'{indent}    <div class="answer"><p>{a}</p></div>\n'
                f'{indent}</details>\n')
    return out


# ---------------------------------------------------------------
# 시공사례 목록 + 상세
# ---------------------------------------------------------------
def build_gallery():
    cards = "".join(case_card(c, extra=" reveal") for c in CASES)
    body = f'''    <section class="page-hero" data-hero="gallery">
        <div class="container">
            <h1>시공 사례</h1>
            <p class="lead">거실 · 안방 · 아이방 · 서재 · 전원주택까지,<br>공간마다 어울리는 커튼과 블라인드 구성을 사례로 보여드립니다.</p>
        </div>
    </section>

    <!-- 새 사례를 추가할 때: 카드 하나를 복사해 맨 위에 붙이고 번호 · 문구 · data-cat(curtain / blind / motor) 수정 -->
    <section class="section">
        <div class="container">
            <div class="filter-bar" role="group" aria-label="사례 분류">
                <button class="filter-btn is-active" data-filter="all">전체</button>
                <button class="filter-btn" data-filter="curtain">커튼</button>
                <button class="filter-btn" data-filter="blind">블라인드</button>
                <button class="filter-btn" data-filter="motor">전동</button>
            </div>
            <div class="case-grid is-even">
{cards}            </div>
        </div>
    </section>
'''
    write("gallery.html", page("gallery.html", "커튼 · 블라인드 시공사례 | 남양주 진접 런던커튼",
                               "런던커튼 커튼 · 블라인드 시공 사례. 거실 린넨 · 쉬폰 이중 커튼, 안방 암막커튼, 콤비 · 우드 블라인드, 아이방 암막 롤스크린, 전원주택 전동커튼까지 공간별 구성을 확인하세요.",
                               "커튼 시공사례, 블라인드 시공사례, 남양주 커튼 시공, 진접 커튼, 거실 커튼, 안방 암막커튼, 콤비블라인드 시공, 우드블라인드 시공, 전동커튼 시공",
                               body, crumbs=[("시공사례", "gallery.html")]))

    for i, c in enumerate(CASES):
        nxt = CASES[(i + 1) % len(CASES)]
        pts = "".join(f"                    <li>{p}</li>\n" for p in c["points"])
        body = f'''    <!-- ===== 사례 상세 (예시) =====
         사진: case-{c["no"]}.jpg, case-{c["no"]}-2.jpg
         실제 현장 사진으로 바꾸면서 지역 · 평수 · 고객 요청사항을 공간 정보와 본문에 적어 주세요.
         (예: 공간 → "남양주 진접 · 아파트 34평 거실")  그다음 <head>의 noindex 줄을 지우고 sitemap.xml 에 추가.
    -->
    <section class="page-hero" data-hero="case" data-hero-img="{v(f'images/cases/case-{c["no"]}.jpg')}" data-crumb="{c["space"]} {c["product"]}">
        <div class="container">
            <h1>{c["title"]}</h1>
            <div class="tag-row">
                <span class="tag">{c["space"]}</span>
                <span class="tag">{c["product"]}</span>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container-narrow">
            <dl class="case-spec">
                <div><dt>공간</dt><dd>{c["space"]}</dd></div>
                <div><dt>제품</dt><dd>{c["spec"]}</dd></div>
                <div><dt>지역</dt><dd>남양주 · 서울 · 경기</dd></div>
                <div><dt>상담</dt><dd>무료 방문 실측</dd></div>
            </dl>

            <article class="prose">
                <h2>시공 내용</h2>
                <p>{c["text"]}</p>

                <div class="case-photos">
                    <figure><img src="{v(f'images/cases/case-{c["no"]}.jpg')}" alt="{c["space"]} {c["product"]} 시공 후 전체" loading="lazy"><figcaption>시공 후 전체</figcaption></figure>
                    <figure><img src="{v(f'images/cases/case-{c["no"]}-2.jpg')}" alt="{c["space"]} {c["product"]} 디테일" loading="lazy"><figcaption>원단 · 레일 디테일</figcaption></figure>
                </div>

                <h3>시공 포인트</h3>
                <ul>
{pts}                </ul>

                <div class="note-box">
                    <strong>비슷한 구성이 마음에 든다면</strong>
                    상담 때 이 사례 번호(case-{c["no"]})를 알려 주세요. 같은 구성을 우리 집 창에 맞춰 제안해 드립니다.
                    <a href="inquiry.html">무료 방문 견적 신청</a>
                </div>
            </article>

            <nav class="pager" aria-label="다른 사례">
                <a href="gallery.html"><small>←</small><strong>사례 목록</strong></a><a href="case-{nxt["no"]}.html"><small>다음 사례 →</small><strong>{nxt["title"]}</strong></a>
            </nav>
        </div>
    </section>
'''
        write(f"case-{c['no']}.html", page(
            f"case-{c['no']}.html", f"{c['space']} {c['product']} 시공사례 - {c['title']} | 런던커튼",
            f"{c['space']} {c['spec']} 시공 사례. {c['text'][:70]}…",
            f"{c['space']} {c['product']}, {c['product']} 시공, {c['product']} 시공사례, 커튼 시공사례, 남양주 커튼",
            body, crumbs=[("시공사례", "gallery.html"), (c["title"], f"case-{c['no']}.html")],
            og_image=f"images/cases/case-{c['no']}.jpg", og_type="article", noindex=True))


# ---------------------------------------------------------------
# 제품
# ---------------------------------------------------------------
PRODUCT_DETAIL = {
    "linen": ("굵고 자연스러운 결이 햇빛을 한 번 걸러 거실 전체를 따뜻한 톤으로 바꿔 줍니다. 오트밀 · 아이보리 · 웜그레이처럼 집 안 마감재와 잘 섞이는 색이 많아, 런던커튼이 거실 겉커튼으로 가장 많이 제안하는 원단이에요.",
              [("특징", "자연스러운 주름과 질감, 은은한 빛 투과"), ("추천 공간", "거실, 안방, 통창"), ("함께 쓰면", "쉬폰 속커튼, 웨이브 주름, 전동 레일"), ("관리", "물세탁 가능 · 드라이 전용 원단을 구분해 상담 때 안내")], "case-01.html"),
    "chiffon": ("얇고 가벼운 쉬폰은 바깥 시선은 흐리게 하고 햇빛은 부드럽게 들여 낮 시간 거실을 환하게 지켜 줍니다. 겉커튼과 이중 레일로 함께 다는 경우가 많고, 조망이 좋은 집에서는 풍경을 은은하게 비춰 줘요.",
                [("특징", "비치는 원단, 가볍게 흔들리는 실루엣"), ("추천 공간", "거실, 안방(이중 커튼의 속커튼), 조망 창"), ("함께 쓰면", "린넨 · 암막 겉커튼"), ("관리", "가벼워 세탁 · 건조가 쉬움")], "case-01.html"),
    "blackout": ("새벽빛과 단지 조명, 가로등 불빛까지 막아 숙면을 돕는 커튼입니다. 원단만큼 중요한 것이 설치로, 레일 위치와 폭 · 길이를 정확히 잡아야 위 · 옆 · 아래로 새는 빛을 줄일 수 있어요.",
                 [("특징", "차광 · 단열 · 소음 완화"), ("추천 공간", "안방, 아이방, 서향 창, 홈시어터"), ("함께 쓰면", "쉬폰 커튼(이중 레일)"), ("관리", "코팅 암막은 건조기 사용 피하기")], "case-02.html"),
    "combi": ("비치는 망사 원단과 막힌 원단이 번갈아 겹쳐 줄 하나로 밝기를 단계적으로 조절합니다. 깔끔하고 합리적이라 신축 입주 때 집 전체를 맞추는 경우 가장 많이 선택돼요.",
              [("특징", "밝기 조절, 깔끔한 일자 라인, 합리적인 가격"), ("추천 공간", "거실, 방, 주방, 사무실"), ("함께 쓰면", "린넨 커튼(거실 레이어드)"), ("관리", "먼지떨이 · 청소기 브러시로 간단히")], "case-03.html"),
    "wood": ("나무 슬랫의 각도를 돌려 빛을 천장 쪽으로 튕기거나 아래로 내릴 수 있습니다. 방은 밝게 두면서 눈부심만 줄이고 싶은 서재 · 공부방에 특히 잘 맞고, 원목 가구와 함께 두면 분위기가 차분해져요.",
             [("특징", "질감 있는 원목, 빛의 방향까지 조절"), ("추천 공간", "거실, 서재, 공부방, 카페"), ("함께 쓰면", "린넨 커튼 측면 장식"), ("관리", "마른 천으로 닦기, 물기 주의")], "case-04.html"),
    "honeycomb": ("단면이 벌집 모양이라 원단 속 공기층이 창가의 냉기와 열기를 줄여 줍니다. 위에서 내리고 아래에서 올리는 상하 개폐가 가능해 아랫부분만 가리고 위로 빛을 들일 수도 있어요.",
                  [("특징", "단열, 부드러운 빛, 상하 개폐"), ("추천 공간", "안방, 주방, 베란다 창, 산 쪽 창"), ("함께 쓰면", "겉커튼(겨울 단열 강화)"), ("관리", "찬바람 드라이기로 먼지 털기")], "case-02.html"),
    "roll": ("원단 한 장을 말아 올리는 가장 단순한 구조라 창이 가장 깔끔해 보입니다. 바깥이 비치는 선스크린, 빛을 막는 암막, 일반 원단까지 원단에 따라 쓰임이 완전히 달라져요.",
             [("특징", "미니멀한 디자인, 다양한 원단"), ("추천 공간", "아이방, 드레스룸, 주방, 사무실, 카페"), ("함께 쓰면", "커튼(암막 보강)"), ("관리", "끝까지 내린 상태에서 청소기")], "case-05.html"),
    "motor": ("손이 닿지 않는 높은 창, 무겁고 넓은 통창도 리모컨이나 스마트폰으로 여닫습니다. 예약 기능으로 아침에 열고 저녁에 닫는 것도 가능해요. 전원 위치가 중요하니 인테리어 공사가 있다면 먼저 상담해 주세요.",
              [("특징", "리모컨 · 벽 스위치 · 앱 조작, 예약 개폐"), ("추천 공간", "전원주택 높은 창, 주상복합 통창, 복층"), ("함께 쓰면", "린넨 웨이브 커튼, 허니콤 · 롤스크린"), ("관리", "레일 · 모터 점검은 A/S로")], "case-06.html"),
}


def build_products():
    nav = "".join(f'                <a href="#{k}" class="filter-btn">{p["name"]}</a>\n' for k, p in PRODUCTS.items())
    blocks = ""
    for k, p in PRODUCTS.items():
        text, specs, case = PRODUCT_DETAIL[k]
        dl = "".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in specs)
        blocks += f'''            <article class="product-block" id="{k}">
                <div class="split-img"><img src="{v('images/products/' + k + '.jpg')}" alt="{p["name"]} 시공 이미지" loading="lazy"></div>
                <div>
                    <h2>{p["name"]}</h2>
                    <span class="en">{p["en"]}</span>
                    <p class="prose">{text}</p>
                    <dl class="spec-list">
                        {dl}
                    </dl>
                    <a href="{case}" class="btn btn-outline">관련 사례 보기 <span class="arrow">→</span></a>
                </div>
            </article>
'''
    body = f'''    <section class="page-hero" data-hero="products">
        <div class="container">
            <h1>제품 안내</h1>
            <p class="lead">원단 한 장, 레일 하나에 따라 창가의 표정이 바뀝니다.<br>런던커튼이 시공하는 8가지 제품을 비교해 보세요.</p>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <nav class="product-nav" aria-label="제품 바로가기">
{nav}            </nav>
{blocks}        </div>
    </section>
'''
    write("products.html", page("products.html", "커튼 · 블라인드 제품 안내 | 린넨 · 암막커튼 · 콤비 · 우드 · 허니콤 | 런던커튼",
                                "린넨 커튼, 쉬폰 커튼, 암막 커튼, 콤비 블라인드, 우드 블라인드, 허니콤 블라인드, 롤스크린, 전동 커튼까지. 남양주 진접 런던커튼이 시공하는 8가지 제품의 특징과 추천 공간을 비교해 보세요.",
                                "린넨커튼, 쉬폰커튼, 암막커튼, 콤비블라인드, 우드블라인드, 허니콤블라인드, 롤스크린, 전동커튼, 전동블라인드, 커튼 종류, 블라인드 종류",
                                body, crumbs=[("제품", "products.html")]))


# ---------------------------------------------------------------
# 지역 목록 + 지역 상세
# ---------------------------------------------------------------
def build_areas():
    groups = ""
    for g, label in GROUPS:
        items = ""
        for a in AREAS:
            if a["group"] != g:
                continue
            cls = ' class="is-base"' if a.get("base") else ""
            small = "런던커튼 본점 →" if a.get("base") else f'{len(a["dongs"])}개 동네 →'
            items += f'                <a href="{area_file(a)}"{cls}>{a["name"]}<small>{small}</small></a>\n'
        extra = " is-home" if g == "namyangju" else ""
        groups += f'            <h2 class="area-group-title">{label}</h2>\n            <div class="area-index{extra}">\n{items}            </div>\n'
    body = f'''    <section class="page-hero" data-hero="areas">
        <div class="container">
            <h1>시공 지역</h1>
            <p class="lead">남양주 진접에서 출발해 남양주 전 지역, 서울 25개 구, 경기 대부분 지역을 무료로 방문합니다.<br>지역을 누르면 동네별 안내를 볼 수 있어요.</p>
        </div>
    </section>

    <!-- 지역 페이지 추가는 _build/areas_data.py 에 한 덩어리 추가 후 build.py 실행 (README 참고) -->
    <section class="section">
        <div class="container">
{groups}            <div class="home-base">
                <p><strong>목록에 없는 지역도 연락 주세요.</strong> 서울 · 경기 대부분 지역은 일정을 조율해 방문합니다.</p>
                <a href="inquiry.html">무료 방문 견적 신청 →</a>
            </div>
        </div>
    </section>
'''
    write("areas.html", page("areas.html", "시공 지역 | 남양주 진접 · 서울 · 경기 커튼 블라인드 무료 실측 | 런던커튼",
                             "런던커튼 시공 지역 안내. 남양주 진접 본점에서 진접 · 오남 · 별내 · 다산 · 호평 · 평내 · 화도 · 와부 · 왕숙신도시, 포천 · 의정부 · 구리, 서울 25개 구와 경기 전 지역 커튼 · 블라인드 무료 방문 실측.",
                             "남양주 커튼, 진접 커튼, 서울 커튼, 경기 커튼, 커튼 시공 지역, 블라인드 시공 지역, 남양주 블라인드, 의정부 커튼, 구리 커튼, 포천 커튼",
                             body, crumbs=[("시공지역", "areas.html")]))

    for idx, a in enumerate(AREAS):
        build_area(a, idx)


LEADS = [
    "{full} 어디든 무료로 방문해 실측합니다. 고르실 원단은 샘플로 챙겨 가 우리 집 창가에서 비교해 드려요.",
    "남양주 진접에서 출발해 {full}까지 직접 방문합니다. 실측과 상담은 무료예요.",
    "{full}의 아파트 · 주택 · 사무실, 창마다 직접 재서 맞춤 제작합니다. 방문 실측 무료.",
]


def build_area(a, idx):
    f = area_file(a)
    name, full = a["name"], a["full"]
    plain = name.replace(" · ", "·")
    d1, d2 = a["dongs"][0], a["dongs"][1] if len(a["dongs"]) > 1 else a["dongs"][0]
    if a["group"] in ("namyangju",):
        title, desc, kw = a["title"], a["desc"], a["kw"]
    else:
        short = name.split(" · ")[0]
        title = f"{short} 커튼 · 블라인드 시공 | {d1.split(' ')[-1]} · {d2.split(' ')[-1]} 무료 실측 | 런던커튼"
        dong_txt = ", ".join(a["dongs"][:5])
        desc = (f"{short} 커튼 · {short} 블라인드 · {short} 암막커튼 시공. {dong_txt} 등 {full} 무료 방문 실측. "
                f"남양주 진접 런던커튼이 원단 샘플을 들고 찾아가 창마다 맞춤 제작합니다.")
        names = [n for n in name.split(" · ")]
        kws = []
        for n in names:
            kws += [f"{n} 커튼", f"{n} 블라인드", f"{n} 커튼 시공", f"{n} 블라인드 시공", f"{n} 암막커튼"]
        kws += [f"{PRODUCTS[k]['name'].replace(' ', '')}" for k in a["picks"] if k != "motor"]
        kws += [f"{d.split(' ')[-1]} 커튼" for d in a["dongs"][:4]]
        kw = ", ".join(dict.fromkeys(kws))

    strong = set(a.get("strong", []))
    dongs = "".join(f'                <li{" class=\"is-strong\"" if d in strong else ""}>{d}</li>\n' for d in a["dongs"])
    paras = "".join(f"                <p>{p}</p>\n" for p in a["paras"])
    picks_li = "".join(f'                    <li><a href="products.html#{k}">{PRODUCTS[k]["name"]}</a> — {PRODUCTS[k]["short"]}</li>\n' for k in a["picks"])
    reads = " · ".join(f'<a href="{s}.html">{POST[s]["title"].split(" — ")[0].split(",")[0]}</a>' for s in a["posts"])
    pick_cards = "".join(product_card(k) for k in a["picks"])
    nearby = "".join(f'                <a href="{area_file(AREA[s])}">{AREA[s]["name"]}</a>\n' for s in a["nearby"])
    lead = LEADS[idx % len(LEADS)].format(full=full)
    img = a["picks"][0]

    faq_html, lds = "", [business_ld(name=f"{BRAND} - {full}", url=f"{SITE}/{f}",
                                     area={"@type": "Place", "name": full},
                                     desc=f"{full} 커튼 · 블라인드 맞춤 제작 및 시공, 무료 방문 실측")]
    if a.get("faq"):
        faq_html = f'''    <section class="section">
        <div class="container-narrow">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">LOCAL FAQ</p>
                    <h2 class="section-title">{plain} 고객님들이 자주 묻는 질문</h2>
                </div>
            </div>
            <div class="faq-list reveal">
{faq_items(a["faq"])}            </div>
        </div>
    </section>
'''
        lds.append(faq_ld(a["faq"]))

    if a.get("base"):
        base_box = '''            <div class="home-base">
                <p><strong>런던커튼은 이곳 진접에 있습니다.</strong> 진접에서 출발해 남양주 전 지역과 서울 · 경기를 방문합니다.</p>
                <a href="area-namyangju.html">남양주 전체 안내 →</a>
            </div>
'''
    elif a["group"] == "namyangju":
        base_box = '''            <div class="home-base">
                <p><strong>런던커튼은 남양주 진접에 있습니다.</strong> 같은 남양주라 일정 조율이 쉽고 시공 뒤 A/S도 빠릅니다.</p>
                <a href="area-jinjeop.html">진접 본점 안내 →</a>
            </div>
'''
    else:
        base_box = f'''            <div class="home-base">
                <p><strong>런던커튼은 남양주 진접에서 출발합니다.</strong> {full}도 출장비 없이 원단 샘플을 들고 방문해요.</p>
                <a href="area-jinjeop.html">진접 본점 안내 →</a>
            </div>
'''

    body = f'''    <section class="page-hero" data-hero="area" data-crumb="{plain}">
        <div class="container">
            <h1>{full}<br>커튼 · 블라인드 맞춤 시공</h1>
            <p class="lead">{lead}</p>
            <div class="hero-buttons">
                <a href="inquiry.html" class="btn btn-light">{plain} 방문 견적 신청 <span class="arrow">→</span></a>
                <a href="tel:{PHONE}" class="btn btn-outline-white">전화 상담</a>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container split">
            <div class="split-img reveal"><img src="{v('images/products/' + img + '.jpg')}" alt="{full} {PRODUCTS[img]['name']} 시공 이미지" loading="lazy"></div>
            <div class="split-text prose reveal d1">
                <p class="section-tag">LOCAL NOTE</p>
                <h2>{a["h2"]}</h2>
{paras}                <h3>{plain}에서 많이 찾는 제품</h3>
                <ul>
{picks_li}                </ul>
                <p>고르기 전에 읽어 보세요: {reads}</p>
            </div>
        </div>
    </section>

{faq_html}    <section class="section bg-sand">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">COVERAGE</p>
                    <h2 class="section-title">{plain} 출장 실측 동네</h2>
                    <p class="section-sub">목록에 없는 동네라도 {full} 안이라면 어디든 찾아갑니다.</p>
                </div>
            </div>
            <ul class="dong-list">
{dongs}            </ul>
{base_box}        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">PRODUCTS</p>
                    <h2 class="section-title">{plain} 추천 구성</h2>
                </div>
                <a href="products.html" class="link-more">제품 전체 보기 →</a>
            </div>
            <div class="pick-grid reveal">
{pick_cards}            </div>
        </div>
    </section>

    <section class="section bg-paper">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">NEARBY</p>
                    <h2 class="section-title">가까운 시공 지역</h2>
                </div>
                <a href="areas.html" class="link-more">시공 지역 전체 →</a>
            </div>
            <nav class="nearby-links" aria-label="가까운 시공 지역">
{nearby}            </nav>
        </div>
    </section>
'''
    write(f, page(f, title, desc, kw, body, crumbs=[("시공지역", "areas.html"), (plain, f)],
                  og_image=f"images/products/{img}.jpg", lds=lds))


# ---------------------------------------------------------------
# 매거진
# ---------------------------------------------------------------
def build_blog():
    cards = "".join(post_card(p) for p in POSTS)
    body = f'''    <section class="page-hero" data-hero="blog">
        <div class="container">
            <h1>매거진</h1>
            <p class="lead">커튼 · 블라인드를 고르기 전에 알아 두면 좋은 이야기.<br>현장에서 자주 받는 질문을 글로 정리했습니다.</p>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="post-grid">
{cards}            </div>
        </div>
    </section>
'''
    write("blog.html", page("blog.html", "매거진 | 커튼 · 블라인드 고르는 법 · 실측 · 관리 가이드 | 런던커튼",
                            "커튼 길이 재는 법, 암막커튼 고르는 법, 콤비 vs 우드 블라인드, 신축 입주 커튼 준비, 커튼 견적, 전동커튼, 세탁법까지. 남양주 진접 런던커튼이 현장에서 정리한 커튼 · 블라인드 가이드.",
                            "커튼 고르는 법, 블라인드 고르는 법, 커튼 길이, 암막커튼, 블라인드 종류, 커튼 가격, 입주 커튼, 커튼 세탁, 전동커튼",
                            body, crumbs=[("매거진", "blog.html")]))

    for i, p in enumerate(POSTS):
        others = [POSTS[(i + k) % len(POSTS)] for k in (1, 2, 3)]
        more = "".join(post_card(o) for o in others)
        body = f'''    <section class="page-hero is-short" data-hero="post" data-hero-img="{v('images/products/' + p['img'] + '.jpg')}" data-crumb="{p["cat"]}">
        <div class="container">
            <h1>{p["title"]}</h1>
            <div class="tag-row"><span class="tag">{p["cat"]}</span><span class="tag">{date_dot(TODAY)}</span></div>
        </div>
    </section>

    <section class="section">
        <article class="container-narrow prose">
{p["body"].strip(chr(10))}
        </article>
    </section>

    <section class="section bg-paper">
        <div class="container">
            <div class="section-head">
                <div>
                    <p class="section-tag">MORE</p>
                    <h2 class="section-title">함께 읽으면 좋은 글</h2>
                </div>
            </div>
            <div class="post-grid">
{more}            </div>
        </div>
    </section>
'''
        ld = {
            "@context": "https://schema.org", "@type": "Article",
            "headline": p["title"], "description": p["desc"],
            "image": f"{SITE}/{v('images/products/' + p['img'] + '.jpg')}",
            "datePublished": TODAY, "dateModified": TODAY,
            "author": {"@type": "Organization", "name": BRAND, "url": SITE + "/"},
            "publisher": {"@type": "Organization", "name": BRAND,
                          "logo": {"@type": "ImageObject", "url": f"{SITE}/images/og-image.jpg"}},
            "mainEntityOfPage": f"{SITE}/{p['slug']}.html",
        }
        write(f"{p['slug']}.html", page(f"{p['slug']}.html", f"{p['title']} | 런던커튼", p["desc"], p["kw"], body,
                                        crumbs=[("매거진", "blog.html"), (p["title"], f"{p['slug']}.html")],
                                        og_image=f"images/products/{p['img']}.jpg", og_type="article", lds=[ld]))


# ---------------------------------------------------------------
# 브랜드 · FAQ · 문의 · 완료
# ---------------------------------------------------------------
def build_about():
    body = f'''    <section class="page-hero" data-hero="about">
        <div class="container">
            <h1>창가에 오래 머무는<br>단정한 아름다움</h1>
            <p class="lead">런던커튼은 남양주 진접에서 시작한 커튼 · 블라인드 맞춤 시공 브랜드입니다.</p>
        </div>
    </section>

    <!-- 브랜드 소개 문구는 초안입니다. 대표님 이야기(경력, 시작한 계기 등)를 넣으면 더 좋아요. -->
    <section class="section">
        <div class="container split">
            <div class="split-img reveal"><img src="{v('images/about/about-01.jpg')}" alt="런던커튼 원단 샘플 상담" loading="lazy"></div>
            <div class="split-text reveal d1">
                <p class="section-tag">OUR STORY</p>
                <h2>오래된 런던의 창가처럼,<br>시간이 지나도 좋은 커튼</h2>
                <p>오래된 도시의 창가에는 몇 년이 지나도 어색하지 않은 커튼이 걸려 있습니다. 화려하지 않아도 그 집의 빛과 구조에 꼭 맞기 때문이에요. 런던커튼이라는 이름에는 그런 창가를 만들고 싶다는 마음을 담았습니다.</p>
                <p>그래서 저희는 유행하는 색보다 그 집에 드는 빛을 먼저 보고, 비싼 원단보다 그 창에 맞는 구성을 먼저 고민합니다.</p>
            </div>
        </div>
    </section>

    <section class="section bg-sand">
        <div class="container">
            <div class="section-head reveal">
                <div>
                    <p class="section-tag">PROMISE</p>
                    <h2 class="section-title">런던커튼이 지키는 네 가지</h2>
                </div>
            </div>
            <div class="process-list reveal">
                <div class="process-item"><span class="step">01</span><h3>직접 재고, 직접 답니다</h3><p>실측과 시공을 남에게 넘기지 않습니다. 상담한 사람이 창을 재고, 그 창에 직접 답니다.</p></div>
                <div class="process-item"><span class="step">02</span><h3>창가에서 고릅니다</h3><p>원단 샘플을 들고 방문해 고객님 집 창에 직접 대 보고 결정하도록 돕습니다.</p></div>
                <div class="process-item"><span class="step">03</span><h3>필요한 만큼만 권합니다</h3><p>기존 레일을 쓸 수 있으면 그대로 쓰고, 모든 창에 비싼 제품을 권하지 않습니다.</p></div>
                <div class="process-item"><span class="step">04</span><h3>달고 나서도 책임집니다</h3><p>시공 뒤 불편한 점이 생기면 연락 주세요. 남양주는 가까워 빠르게 들릅니다.</p></div>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container split reverse">
            <div class="split-img reveal"><img src="{v('images/about/about-02.jpg')}" alt="커튼 설치 마무리 모습" loading="lazy"></div>
            <div class="split-text reveal d1">
                <p class="section-tag">SERVICE AREA</p>
                <h2>남양주 진접에서<br>서울 · 경기 어디든</h2>
                <p>런던커튼은 경기 남양주시 진접읍에 있습니다. 진접 · 오남 · 별내 · 다산 · 호평 · 평내 · 화도 · 와부 · 진건 · 퇴계원 등 남양주 전 지역은 물론, 포천 · 의정부 · 구리 · 양주 같은 이웃 도시와 서울 25개 구, 경기 대부분 지역을 직접 방문합니다.</p>
                <a href="areas.html" class="btn btn-outline">시공 지역 보기 <span class="arrow">→</span></a>
            </div>
        </div>
    </section>
'''
    write("about.html", page("about.html", "런던커튼 소개 | 남양주 진접 커튼 · 블라인드 맞춤 시공",
                             "런던커튼은 남양주 진접에서 시작한 커튼 · 블라인드 맞춤 시공 브랜드입니다. 직접 실측하고 직접 시공하며, 원단 샘플을 들고 남양주 · 서울 · 경기 어디든 방문합니다.",
                             "런던커튼, 런던커튼 남양주, 진접 커튼, 남양주 커튼, 커튼 업체, 블라인드 업체",
                             body, crumbs=[("브랜드", "about.html")], lds=[business_ld(url=SITE + "/about.html")]))


FAQ_GROUPS = [
    ("상담 · 실측", [
        ("방문 실측과 상담 비용이 있나요?", "남양주와 서울 · 경기 지역은 출장비와 상담비 없이 원단 샘플을 들고 방문해 실측과 견적을 드립니다."),
        ("견적만 받아 봐도 괜찮나요?", "물론입니다. 견적을 받아 보시고 천천히 결정하셔도 됩니다. 계약을 서두르게 하지 않아요."),
        ("창문 사진으로 먼저 견적을 받을 수 있나요?", "창 사진과 대략적인 크기를 보내주시면 예상 견적과 추천 구성을 먼저 안내해 드립니다. 정확한 금액은 방문 실측 후 확정돼요."),
        ("주말이나 저녁에도 방문하나요?", "가능한 범위에서 일정을 맞춰 드립니다. 원하시는 시간대를 신청서에 적어 주세요."),
    ]),
    ("제작 · 시공", [
        ("주문하고 설치까지 얼마나 걸리나요?", "실측 후 맞춤 제작에 보통 일주일 안팎이 걸립니다. 원단 재고와 입주 성수기에 따라 달라질 수 있어 상담 때 정확히 안내해 드려요."),
        ("시공 시간은 얼마나 걸리나요?", "일반 가정 기준으로 몇 시간 안에 끝나는 경우가 대부분입니다. 창 개수와 전동 제품 여부에 따라 달라집니다."),
        ("기존 커튼 · 블라인드 철거도 해 주나요?", "네, 시공 때 기존 제품을 함께 떼어 드립니다. 기존 레일을 그대로 쓸 수 있는지도 확인해 드려요."),
        ("전세집이라 벽에 구멍을 뚫기 어려워요.", "커튼박스의 기존 레일이나 창틀 브라켓을 활용한 무타공 설치를 먼저 검토해 드립니다. 창 구조에 따라 가능 여부가 달라 실측 때 정확히 안내해요."),
    ]),
    ("제품", [
        ("커튼과 블라인드 중 무엇이 좋을까요?", "거실처럼 분위기가 중요한 곳은 커튼, 방 · 주방처럼 깔끔함과 조작이 중요한 곳은 블라인드를 많이 선택합니다. 공간마다 섞어 쓰셔도 좋아요."),
        ("암막 커튼이면 방이 완전히 깜깜해지나요?", "원단은 빛을 거의 막지만 커튼 가장자리로 새는 빛이 있을 수 있습니다. 레일 위치와 폭 · 길이를 맞춰 빛샘을 최대한 줄이도록 시공해 드려요."),
        ("전동 커튼은 어떤 조건이 필요한가요?", "커튼박스 근처에 전원(콘센트)이 있어야 합니다. 인테리어 공사가 있다면 공사 전에 상담해 주시면 선이 보이지 않게 준비할 수 있어요."),
        ("커튼은 세탁할 수 있나요?", "물세탁이 가능한 원단과 드라이 전용 원단이 있습니다. 원단을 고를 때 관리 방법도 함께 안내해 드려요."),
    ]),
    ("지역 · A/S", [
        ("어느 지역까지 방문하나요?", "남양주 전 지역(진접 · 오남 · 별내 · 다산 · 호평 · 평내 · 화도 · 와부 · 진건 · 퇴계원 등)과 포천 · 의정부 · 구리 · 양주, 서울 25개 구, 경기 대부분 지역을 방문합니다."),
        ("런던커튼은 어디에 있나요?", "경기 남양주시 진접읍에 있습니다. 매장 방문보다 원단 샘플을 들고 고객님 댁으로 찾아가는 방문 상담 중심으로 운영해요."),
        ("시공 후 문제가 생기면 어떻게 하나요?", "전화나 카카오톡으로 사진을 보내 주시면 확인 후 방문해 점검합니다. A/S 기간과 범위는 상담 때 자세히 안내해 드려요."),
        ("신축 아파트 사전점검 때 실측할 수 있나요?", "네. 사전점검 날 실측하면 입주일에 맞춰 바로 설치할 수 있어 가장 권해 드리는 방법입니다. 단지에 따라 사전 방문 신청이 필요할 수 있어요."),
    ]),
]


def build_faq():
    groups = ""
    all_pairs = []
    for label, pairs in FAQ_GROUPS:
        all_pairs += pairs
        groups += f'            <h2 class="faq-group-title">{label}</h2>\n            <div class="faq-list">\n{faq_items(pairs)}            </div>\n'
    body = f'''    <section class="page-hero is-short" data-hero="faq">
        <div class="container">
            <h1>자주 묻는 질문</h1>
            <p class="lead">상담 · 실측부터 제작 · 시공, 제품, A/S까지 자주 받는 질문을 모았습니다.</p>
        </div>
    </section>

    <section class="section">
        <div class="container-narrow">
{groups}            <div class="note-box mt-48">
                <strong>찾는 답이 없나요?</strong>
                전화나 카카오톡으로 편하게 물어보세요. <a href="inquiry.html">무료 견적 신청</a>
            </div>
        </div>
    </section>
'''
    write("faq.html", page("faq.html", "자주 묻는 질문 | 커튼 · 블라인드 실측 · 시공 · A/S | 런던커튼",
                           "커튼 · 블라인드 방문 실측 비용, 제작 기간, 무타공 설치, 암막 커튼 빛샘, 전동 커튼 조건, 시공 지역과 A/S까지 남양주 진접 런던커튼에 자주 묻는 질문을 정리했습니다.",
                           "커튼 실측 비용, 커튼 제작 기간, 무타공 커튼, 암막커튼 빛샘, 전동커튼 설치 조건, 커튼 A/S, 남양주 커튼",
                           body, crumbs=[("FAQ", "faq.html")], lds=[faq_ld(all_pairs)]))


def build_inquiry():
    regions = [
        "남양주 진접 · 오남", "남양주 별내", "남양주 다산", "남양주 호평 · 평내 · 금곡",
        "남양주 화도 · 와부 · 진건 · 퇴계원 · 기타", "왕숙신도시 (입주 예정)",
        "포천 · 의정부 · 구리 · 양주 · 가평", "서울 동북권 (노원 · 도봉 · 중랑 · 강북 · 성북 등)",
        "서울 기타 지역", "경기 기타 지역",
    ]
    opts = "".join(f'                        <option value="{r}">{r}</option>\n' for r in regions)
    types = ["린넨 커튼", "쉬폰 커튼", "암막 커튼", "콤비 블라인드", "우드 블라인드", "허니콤 블라인드", "롤스크린", "전동 제품", "잘 모르겠어요"]
    checks = "".join(f'                        <label><input type="checkbox" name="type" value="{t}"><span>{t}</span></label>\n' for t in types)
    body = f'''    <section class="page-hero is-short" data-hero="inquiry">
        <div class="container">
            <h1>무료 방문 견적 신청</h1>
            <p class="lead">남겨 주신 내용을 확인하고 연락드려 방문 일정을 잡아 드립니다.</p>
        </div>
    </section>

    <section class="section">
        <div class="container inquiry-layout">
            <aside class="inquiry-aside">
                <h2>창문 사진이 있다면<br>더 빠르게 안내해 드려요</h2>
                <p>신청서를 남기신 뒤 카카오톡으로 창문 사진을 보내주시면 방문 전에 대략적인 견적과 추천 구성을 먼저 알려드립니다. 신축 입주 예정이라면 단지 · 평형 · 타입을 적어 주세요.</p>
                <div class="channel-list">
                    <a href="tel:{PHONE}" class="channel"><div><strong>전화 상담</strong><span data-text="phone">{PHONE}</span></div><span class="go">→</span></a>
                    <a href="#" class="channel" data-link="kakao"><div><strong>카카오톡 상담</strong><span>사진 보내고 바로 상담</span></div><span class="go">→</span></a>
                </div>
            </aside>

            <!-- 폼 전송 주소와 메일 제목은 js/config.js 에서 관리 (formspreeId) -->
            <form class="inquiry-form" action="#" method="POST">
                <input type="hidden" name="_next" value="{SITE}/thanks.html">
                <input type="hidden" name="_subject" value="[런던커튼] 새 견적 문의가 도착했습니다">
                <input type="hidden" name="사이트" value="런던커튼">
                <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">

                <div class="form-group">
                    <label class="title" for="f-name">성함 <span class="required">*</span></label>
                    <input type="text" id="f-name" name="name" required placeholder="홍길동" autocomplete="name">
                </div>
                <div class="form-group">
                    <label class="title" for="f-phone">연락처 <span class="required">*</span></label>
                    <input type="tel" id="f-phone" name="phone" required placeholder="010-0000-0000" autocomplete="tel">
                </div>
                <div class="form-group">
                    <label class="title" for="f-region">지역 <span class="required">*</span></label>
                    <select id="f-region" name="region" required>
                        <option value="">지역을 선택해 주세요</option>
{opts}                    </select>
                </div>
                <div class="form-group">
                    <label class="title" for="f-address">상세 주소 (동 · 아파트명)</label>
                    <input type="text" id="f-address" name="address" placeholder="예: 진접읍 장현리 ○○아파트">
                </div>
                <div class="form-group">
                    <label class="title" for="f-space">시공 공간 <span class="required">*</span></label>
                    <select id="f-space" name="space" required>
                        <option value="">공간을 선택해 주세요</option>
                        <option value="거실">거실</option>
                        <option value="안방 · 침실">안방 · 침실</option>
                        <option value="아이방">아이방</option>
                        <option value="서재 · 공부방">서재 · 공부방</option>
                        <option value="주방">주방</option>
                        <option value="집 전체 (신축 입주)">집 전체 (신축 입주)</option>
                        <option value="집 전체 (교체)">집 전체 (교체)</option>
                        <option value="전원주택">전원주택</option>
                        <option value="사무실 · 매장 · 카페">사무실 · 매장 · 카페</option>
                    </select>
                </div>
                <div class="form-group">
                    <span class="title" style="display:block;font-size:15px;font-weight:600;color:var(--color-ink);margin-bottom:10px">관심 제품 (복수 선택)</span>
                    <div class="check-grid">
{checks}                    </div>
                </div>
                <div class="form-group">
                    <label class="title" for="f-date">희망 방문일</label>
                    <input type="date" id="f-date" name="visit_date">
                </div>
                <div class="form-group">
                    <label class="title" for="f-msg">요청 사항</label>
                    <textarea id="f-msg" name="message" placeholder="입주 · 이사 일정, 원하시는 분위기, 참고하고 싶은 사례 번호 등을 자유롭게 적어 주세요."></textarea>
                </div>
                <label class="agree"><input type="checkbox" required> <span>견적 상담을 위해 성함 · 연락처 · 주소를 수집하고 이용하는 데 동의합니다. 이 정보는 상담에만 쓰이며 상담이 끝나면 파기합니다.</span></label>
                <button type="submit" class="btn btn-primary">무료 견적 신청하기</button>
            </form>
        </div>
    </section>
'''
    write("inquiry.html", page("inquiry.html", "무료 방문 견적 신청 | 남양주 진접 커튼 · 블라인드 런던커튼",
                               "커튼 · 블라인드 무료 방문 견적 신청. 남양주 진접 런던커튼이 원단 샘플을 들고 남양주 · 서울 · 경기 어디든 방문해 실측하고 견적을 드립니다.",
                               "커튼 견적, 블라인드 견적, 커튼 무료 실측, 남양주 커튼 견적, 진접 커튼 견적, 커튼 상담",
                               body, crumbs=[("견적문의", "inquiry.html")]))


def build_thanks():
    body = '''    <section class="page-hero" data-hero="thanks">
        <div class="container">
            <h1>견적 신청이 접수되었습니다</h1>
            <p class="lead">남겨 주신 연락처로 빠르게 연락드리겠습니다.<br>기다리시는 동안 매거진과 시공 사례를 둘러보세요.</p>
            <div class="hero-buttons">
                <a href="blog.html" class="btn btn-light">매거진 보기 <span class="arrow">→</span></a>
                <a href="index.html" class="btn btn-outline-white">홈으로</a>
            </div>
        </div>
    </section>
'''
    write("thanks.html", page("thanks.html", "신청 완료 | 런던커튼", "견적 신청이 접수되었습니다.", "런던커튼", body, noindex=True))


# ---------------------------------------------------------------
# includes.js (헤더 · 푸터 · 지역 링크)
# ---------------------------------------------------------------
def build_includes():
    completed = ",\n".join(f'  "{a["name"]}": "{area_file(a)}"' for a in AREAS)
    order = ",".join(f'"{a["name"]}"' for a in AREAS)
    tpl = open(os.path.join(os.path.dirname(__file__), "includes.template.js"), encoding="utf-8").read()
    js = (tpl.replace("/*__COMPLETED_AREAS__*/", completed)
             .replace("/*__ALL_AREAS__*/", order)
             .replace("__VER__", VER))
    write("js/includes.js", js)


# ---------------------------------------------------------------
# sitemap · rss · robots · htaccess · favicon
# ---------------------------------------------------------------
def build_meta_files():
    pri = {"index.html": "1.0", "inquiry.html": "0.9", "gallery.html": "0.8", "products.html": "0.8",
           "areas.html": "0.9", "blog.html": "0.7", "about.html": "0.6", "faq.html": "0.7"}
    urls = []
    for p in ["index.html", "areas.html", "inquiry.html", "products.html", "gallery.html", "blog.html", "faq.html", "about.html"]:
        urls.append((p, pri[p]))
    for a in AREAS:
        urls.append((area_file(a), "0.9" if a["group"] == "namyangju" else ("0.8" if a["group"] == "near" else "0.7")))
    for p in POSTS:
        urls.append((p["slug"] + ".html", "0.6"))
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u, pr in urls:
        loc = SITE + "/" + ("" if u == "index.html" else u)
        xml += f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <priority>{pr}</priority>\n  </url>\n"
    xml += "  <!-- 시공사례(case-0N.html)는 실제 사진으로 바꾼 뒤 여기에 추가하세요 -->\n</urlset>\n"
    write("sitemap.xml", xml)

    items = ""
    for p in POSTS:
        items += f'''    <item>
      <title>{esc(p["title"])}</title>
      <link>{SITE}/{p["slug"]}.html</link>
      <guid>{SITE}/{p["slug"]}.html</guid>
      <description>{esc(p["desc"])}</description>
      <category>{esc(p["cat"])}</category>
      <pubDate>Wed, 07 Oct 2026 12:00:00 +0900</pubDate>
    </item>
'''
    write("rss.xml", f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{BRAND} 매거진</title>
    <link>{SITE}/</link>
    <description>남양주 진접 런던커튼의 커튼 · 블라인드 가이드</description>
    <language>ko</language>
{items}  </channel>
</rss>
''')

    write("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /thanks.html\nDisallow: /_build/\n\nSitemap: {SITE}/sitemap.xml\n")

    write(".htaccess", f'''# ============================================
# 런던커튼 - 서버 설정 (Apache 웹호스팅용)
# ▸ http:// 또는 www. 로 들어와도 https://{DOMAIN} 로 이동
#   (검색엔진이 주소를 하나로만 인식하게 해서 노출 점수가 나뉘지 않게 함)
# ▸ 업로드 후 "리디렉션이 너무 많습니다" 오류가 나면
#   호스팅 관리 화면에서 이미 https 자동 이동을 켜 둔 경우입니다.
#   그때는 아래 RewriteCond %{{HTTPS}} off [OR] 줄을 지우세요.
# ============================================

RewriteEngine On
RewriteCond %{{HTTPS}} off [OR]
RewriteCond %{{HTTP_HOST}} ^www\\. [NC]
RewriteRule ^ https://{DOMAIN}%{{REQUEST_URI}} [L,R=301]

# 생성기 폴더는 외부에서 볼 수 없게
RewriteRule ^_build/ - [F,L]

# 텍스트 파일 압축 (페이지 로딩 속도 향상)
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript application/json image/svg+xml text/xml application/xml application/rss+xml
</IfModule>

# 브라우저 캐시 (사진 · CSS · JS 재방문 시 빠르게)
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 day"
    ExpiresByType image/png "access plus 1 day"
    ExpiresByType image/svg+xml "access plus 1 day"
    ExpiresByType text/css "access plus 1 hour"
    ExpiresByType application/javascript "access plus 1 hour"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>
''')

    return  # 파비콘은 images/favicon.png (로고에서 생성)
    write("images/favicon.svg", '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1C2633"/>
  <g fill="none" stroke="#B8955E" stroke-width="3" stroke-linecap="round">
    <rect x="12" y="12" width="40" height="40"/>
    <path d="M12 19h40"/>
    <path d="M20 19c0 12 4 22 10 33M44 19c0 12-4 22-10 33"/>
  </g>
</svg>
''')


if __name__ == "__main__":
    build_index()
    build_gallery()
    build_products()
    build_areas()
    build_blog()
    build_about()
    build_faq()
    build_inquiry()
    build_thanks()
    build_includes()
    build_meta_files()
    print(f"{len(written)} files written")
