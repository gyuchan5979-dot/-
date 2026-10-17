"""런던커튼 사이트 생성기 - 공통 설정과 HTML 틀.

이 폴더(_build)는 FTP에 올리지 않아도 됩니다.
`python3 _build/build.py` 를 실행하면 루트의 HTML · sitemap.xml · rss.xml · js/includes.js 가 다시 만들어집니다.
"""
import html
import json

DOMAIN = "londoncurtain.co.kr"
SITE = "https://" + DOMAIN
BRAND = "런던커튼"
BRAND_EN = "LONDON CURTAIN"
PHONE = "010-6394-6285"
VER = "202610171200"             # 캐시 갱신용 (사진 · CSS를 바꾸면 숫자 올리기)
TODAY = "2026-10-07"
BASE_LOCALITY = "남양주시 진접읍"

esc = html.escape


def v(path):
    """정적 파일 주소에 캐시 버전 붙이기"""
    return f"{path}?v={VER}"


def ld_script(obj):
    return ('    <script type="application/ld+json">\n'
            + json.dumps(obj, ensure_ascii=False, indent=4).replace("\n", "\n    ")
            + "\n    </script>\n")


def business_ld(name=None, url=SITE + "/", area=None, desc=None):
    obj = {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        "name": name or BRAND,
        "alternateName": BRAND_EN,
        "url": url,
        "image": SITE + "/" + v("images/og-image.jpg"),
        "telephone": PHONE,
        "legalName": "런던 커튼&블라인드",
        "taxID": "431-71-00596",
        "founder": {"@type": "Person", "name": "송민영"},
        "priceRange": "₩₩",
        "description": desc or "남양주 진접을 중심으로 서울 · 경기 전 지역 커튼 · 블라인드 맞춤 제작과 시공. 원단 샘플을 들고 무료 방문 실측합니다.",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR",
            "addressRegion": "경기도",
            "addressLocality": BASE_LOCALITY,
        },
        "areaServed": area or [
            {"@type": "City", "name": "남양주시"},
            {"@type": "Place", "name": "남양주 진접읍"},
            {"@type": "AdministrativeArea", "name": "서울특별시"},
            {"@type": "AdministrativeArea", "name": "경기도"},
        ],
    }
    return obj


def breadcrumb_ld(crumbs):
    """crumbs: [(이름, 파일명 또는 '')]"""
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n,
             "item": SITE + "/" + ("" if f in ("index.html", "") and i == 0 else f)}
            for i, (n, f) in enumerate(crumbs)
        ],
    }


def faq_ld(pairs):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in pairs
        ],
    }


def head(title, desc, keywords, path, og_image="images/og-image.jpg", og_type="website",
         lds=(), noindex=False, verify=False):
    url = SITE + "/" + ("" if path == "index.html" else path)
    t, d = esc(title), esc(desc)
    out = f'''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO 메타태그 -->
    <title>{t}</title>
    <meta name="description" content="{d}">
    <meta name="keywords" content="{esc(keywords)}">
'''
    if noindex:
        out += '    <!-- 예시 페이지: 실제 사진과 내용으로 바꾼 뒤 아래 줄을 지우고 sitemap.xml 에 추가하세요 -->\n'
        out += '    <meta name="robots" content="noindex, follow">\n'
    out += f'''    <link rel="canonical" href="{url}">
    <meta property="og:type" content="{og_type}">
    <meta property="og:site_name" content="{BRAND}">
    <meta property="og:locale" content="ko_KR">
    <meta property="og:title" content="{t}">
    <meta property="og:description" content="{d}">
    <meta property="og:image" content="{SITE}/{v(og_image)}">
    <meta property="og:url" content="{url}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#1C2633">
    <link rel="icon" href="{v('images/favicon.svg')}" type="image/svg+xml">
    <link rel="alternate" type="application/rss+xml" title="{BRAND} 매거진" href="{SITE}/rss.xml">
'''
    if verify:
        out += '''    <!-- 네이버 서치어드바이저 / 구글 서치콘솔 인증 메타태그는 여기에 붙여넣기 -->
    <!-- <meta name="naver-site-verification" content=""> -->
    <!-- <meta name="google-site-verification" content=""> -->
'''
    for obj in lds:
        out += ld_script(obj)
    out += f'''
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Serif+KR:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
    <link rel="stylesheet" href="{v('css/reset.css')}">
    <link rel="stylesheet" href="{v('css/style.css')}">
    <script>document.documentElement.classList.add('js');</script>
</head>
<body>

    <!-- 공통 헤더 (includes.js가 채움) -->
    <div id="site-header"></div>

    <main>
'''
    return out


def foot():
    return f'''    </main>

    <!-- 하단 상담 섹션 (includes.js가 채움) -->
    <div id="site-cta"></div>

    <!-- 공통 푸터 (includes.js가 채움) -->
    <div id="site-footer"></div>

    <script src="{v('js/config.js')}"></script>
    <script src="{v('js/includes.js')}"></script>
    <script src="{v('js/main.js')}"></script>
</body>
</html>
'''


def page(path, title, desc, keywords, body, crumbs=None, **kw):
    lds = list(kw.pop("lds", ()))
    if crumbs:
        lds.append(breadcrumb_ld([("홈", "index.html")] + crumbs))
    return head(title, desc, keywords, path, lds=lds, **kw) + body + foot()


# ---------------------------------------------------------------
# 제품 (products.html 의 #앵커와 이미지 파일명)
# ---------------------------------------------------------------
PRODUCTS = {
    "linen":     {"name": "린넨 커튼",        "en": "LINEN CURTAIN",    "short": "도톰한 결이 빛을 따뜻하게 거르는 겉커튼"},
    "chiffon":   {"name": "쉬폰 커튼",        "en": "CHIFFON SHEER",    "short": "시선은 흐리고 햇살은 들이는 속커튼"},
    "blackout":  {"name": "암막 커튼",        "en": "BLACKOUT CURTAIN", "short": "새벽빛과 가로등 빛까지 막는 침실 커튼"},
    "combi":     {"name": "콤비 블라인드",    "en": "COMBI BLIND",      "short": "줄 하나로 밝기를 조절하는 실속형"},
    "wood":      {"name": "우드 블라인드",    "en": "WOOD BLIND",       "short": "슬랫 각도로 빛의 방향까지 조절"},
    "honeycomb": {"name": "허니콤 블라인드",  "en": "HONEYCOMB SHADE",  "short": "공기층으로 창가 냉기를 덜어 주는 단열형"},
    "roll":      {"name": "롤스크린",          "en": "ROLLER SCREEN",    "short": "가장 단정한 선, 원단 선택이 자유로운"},
    "motor":     {"name": "전동 커튼 · 블라인드", "en": "MOTORIZED",      "short": "높은 창과 넓은 통창을 버튼 하나로"},
}


def product_card(key, cls="product-card"):
    p = PRODUCTS[key]
    return (f'                <a href="products.html#{key}" class="{cls}">\n'
            f'                    <div class="product-img"><img src="{v("images/products/" + key + ".jpg")}" alt="{p["name"]} 시공 이미지" loading="lazy"></div>\n'
            f'                    <h3>{p["name"]}</h3>\n'
            f'                    <p>{p["short"]}</p>\n'
            f'                </a>\n')
