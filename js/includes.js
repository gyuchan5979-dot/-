/* =========================================================
   런던커튼 공통 영역 (한 곳에서 관리)
   -------------------------------------------------------
   ▸ 이 파일 하나로 [헤더 · 히어로 · 푸터 · 플로팅 버튼]을 관리합니다.
     수정하면 전 페이지에 바로 반영돼요.
   ▸ 연락처/카톡 주소는 js/config.js 에서 바꾸세요.
   ▸ 지역 목록(COMPLETED_AREAS · ALL_AREAS)은 _build/build.py 가 자동으로 채웁니다.
   ▸ 각 페이지의 제목(h1)·설명 문구·경로 구조화 데이터는 SEO를 위해 HTML 안에 그대로 둡니다.
     이 파일은 배경 사진, 영문 소제목, 화면에 보이는 경로(홈 > 페이지)만 채워 줍니다.
   ========================================================= */

/* ✅ 메뉴 (헤더와 푸터에 같이 쓰임) */
var NAV_MENU = [
  { name: "시공사례", href: "gallery.html" },
  { name: "제품",     href: "products.html" },
  { name: "시공지역", href: "areas.html" },
  { name: "매거진",   href: "blog.html" },
  { name: "브랜드",   href: "about.html" },
  { name: "FAQ",      href: "faq.html" },
  { name: "견적문의", href: "inquiry.html" }
];

/* ✅ 메인 히어로 슬라이드 (사진만 바꾸려면 같은 파일명으로 FTP 업로드)
      caption: 사진 오른쪽 아래에 작게 표시되는 사진 설명 */
var HOME_HERO_SLIDES = [
  { img: "images/hero/hero-01.jpg?v=202610172000", caption: "거실 · 겉커튼 + 쉬폰",   alt: "거실 베이지 겉커튼과 화이트 쉬폰 실제 시공 사진" },
  { img: "images/hero/hero-02.jpg?v=202610172000", caption: "침실 · 화이트 쉬폰",     alt: "침실 화이트 쉬폰 커튼 실제 시공 사진" },
  { img: "images/hero/hero-03.jpg?v=202610172000", caption: "매장 · 코너 통창 쉬폰",  alt: "매장 코너 통창 화이트 쉬폰 커튼 실제 시공 사진" }
];

/* ✅ 서브 페이지 히어로 (HTML의 data-hero="키" 와 연결)
      img: 배경 사진 / eyebrow: 제목 위 영문 소제목 */
var PAGE_HEROES = {
  gallery:  { img: "images/hero/hero-gallery.jpg?v=202610172000",  eyebrow: "WORKS" },
  "case":   { img: "images/hero/hero-gallery.jpg?v=202610172000",  eyebrow: "CASE STUDY",  parent: { name: "시공사례", href: "gallery.html" } },
  products: { img: "images/hero/hero-products.jpg?v=202610172000", eyebrow: "PRODUCTS" },
  areas:    { img: "images/hero/hero-areas.jpg?v=202610172000",    eyebrow: "SERVICE AREA" },
  area:     { img: "images/hero/hero-areas.jpg?v=202610172000",    eyebrow: "SERVICE AREA", parent: { name: "시공지역", href: "areas.html" } },
  blog:     { img: "images/hero/hero-blog.jpg?v=202610172000",     eyebrow: "MAGAZINE" },
  post:     { img: "images/hero/hero-blog.jpg?v=202610172000",     eyebrow: "MAGAZINE",    parent: { name: "매거진", href: "blog.html" } },
  about:    { img: "images/hero/hero-about.jpg?v=202610172000",    eyebrow: "BRAND STORY" },
  faq:      { img: "images/hero/hero-faq.jpg?v=202610172000",      eyebrow: "FAQ" },
  inquiry:  { img: "images/hero/hero-inquiry.jpg?v=202610172000",  eyebrow: "CONTACT" },
  thanks:   { img: "images/hero/hero-inquiry.jpg?v=202610172000",  eyebrow: "THANK YOU" }
};

/* ✅ 지역 페이지 (자동 생성) */
var COMPLETED_AREAS = {
  "진접": "area-jinjeop.html",
  "오남": "area-onam.html",
  "별내": "area-byeollae.html",
  "다산": "area-dasan.html",
  "호평": "area-hopyeong.html",
  "평내": "area-pyeongnae.html",
  "화도 · 마석": "area-hwado.html",
  "와부 · 덕소": "area-deokso.html",
  "진건 · 퇴계원": "area-jingeon.html",
  "왕숙신도시": "area-wangsuk.html",
  "남양주": "area-namyangju.html",
  "포천": "area-pocheon.html",
  "의정부": "area-uijeongbu.html",
  "구리": "area-guri.html",
  "양주": "area-yangju.html",
  "가평": "area-gapyeong.html",
  "노원": "area-nowon.html",
  "도봉": "area-dobong.html",
  "강북": "area-gangbuk.html",
  "중랑": "area-jungnang.html",
  "성북": "area-seongbuk.html",
  "동대문": "area-dongdaemun.html",
  "광진": "area-gwangjin.html",
  "성동": "area-seongdong.html",
  "종로": "area-jongno.html",
  "중구": "area-junggu.html",
  "용산": "area-yongsan.html",
  "마포": "area-mapo.html",
  "서대문": "area-seodaemun.html",
  "은평": "area-eunpyeong.html",
  "강서": "area-gangseo.html",
  "양천": "area-yangcheon.html",
  "구로": "area-guro.html",
  "금천": "area-geumcheon.html",
  "영등포": "area-yeongdeungpo.html",
  "동작": "area-dongjak.html",
  "관악": "area-gwanak.html",
  "서초": "area-seocho.html",
  "강남": "area-gangnam.html",
  "송파": "area-songpa.html",
  "강동": "area-gangdong.html",
  "하남": "area-hanam.html",
  "분당 · 판교": "area-seongnam.html",
  "일산 · 고양": "area-goyang.html",
  "수원": "area-suwon.html",
  "용인": "area-yongin.html",
  "동탄 · 화성": "area-hwaseong.html",
  "평촌 · 안양": "area-anyang.html",
  "산본 · 군포": "area-gunpo.html",
  "의왕": "area-uiwang.html",
  "과천": "area-gwacheon.html",
  "광명": "area-gwangmyeong.html",
  "부천": "area-bucheon.html",
  "시흥": "area-siheung.html",
  "안산": "area-ansan.html",
  "김포": "area-gimpo.html",
  "파주": "area-paju.html",
  "광주": "area-gwangju.html",
  "이천": "area-icheon.html",
  "양평": "area-yangpyeong.html",
  "오산": "area-osan.html",
  "평택": "area-pyeongtaek.html"
};

/* 푸터에 노출할 전체 지역 순서 (남양주 → 인접 → 서울 → 경기) */
var ALL_AREAS = ["진접","오남","별내","다산","호평","평내","화도 · 마석","와부 · 덕소","진건 · 퇴계원","왕숙신도시","남양주","포천","의정부","구리","양주","가평","노원","도봉","강북","중랑","성북","동대문","광진","성동","종로","중구","용산","마포","서대문","은평","강서","양천","구로","금천","영등포","동작","관악","서초","강남","송파","강동","하남","분당 · 판교","일산 · 고양","수원","용인","동탄 · 화성","평촌 · 안양","산본 · 군포","의왕","과천","광명","부천","시흥","안산","김포","파주","광주","이천","양평","오산","평택"];

/* ===================================================== */
/* 아래부터는 구조 코드입니다. 디자인 변경이 아니면 수정할 필요 없어요. */
/* ===================================================== */

var C = (typeof SITE_CONFIG !== "undefined") ? SITE_CONFIG : {};

var areaLinks = ALL_AREAS.map(function (name) {
  return COMPLETED_AREAS[name]
    ? '<a href="' + COMPLETED_AREAS[name] + '">' + name + '</a>'
    : '<span>' + name + '</span>';
}).join("");

var navItems = NAV_MENU.map(function (m) {
  return '<li><a href="' + m.href + '">' + m.name + '</a></li>';
}).join("");

var logoMark = '<img class="logo-mark" src="images/brand/logo-icon-sm.png?v=202610172000" alt="" width="58" height="60">';

/* ===== 공통 헤더 ===== */
var headerHTML = ''
+ '<header class="site-header" id="siteHeader">'
+ '  <div class="header-inner">'
+ '    <a href="index.html" class="logo" aria-label="' + C.companyName + ' 홈">' + logoMark
+ '      <span class="logo-text"><span class="logo-name">런던커튼&amp;블라인드</span><span class="logo-sub">LONDON CURTAIN &amp; BLIND</span></span>'
+ '    </a>'
+ '    <nav class="main-nav" id="mainNav" aria-label="주 메뉴"><ul>' + navItems + '</ul>'
+ '      <div class="nav-mobile-contact">'
+ '        <a href="tel:' + C.phone + '" class="btn btn-light">전화 ' + C.phone + '</a>'
+ '        <a href="' + C.kakaoUrl + '" class="btn btn-kakao">카카오톡 상담</a>'
+ '      </div>'
+ '    </nav>'
+ '    <a href="inquiry.html" class="header-cta">무료 견적</a>'
+ '    <button class="menu-toggle" id="menuToggle" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>'
+ '  </div>'
+ '</header>';

/* ===== 공통 푸터 ===== */
var bizLine = [
  C.companyName + (C.legalName ? ' (상호: ' + C.legalName + ')' : ''),
  C.ceo ? '대표 ' + C.ceo : '',
  C.bizNumber ? '사업자등록번호 ' + C.bizNumber : '',
  C.address
].filter(Boolean).join(' · ');

var footerHTML = ''
+ '<footer class="site-footer">'
+ '  <div class="container">'
+ '    <div class="footer-top">'
+ '      <div class="footer-brand">'
+ '        <p class="footer-logo"><img src="images/brand/logo-icon-sm.png?v=202610172000" alt="" width="46" height="48">런던커튼&amp;블라인드</p>'
+ '        <p class="footer-slogan">창가에 오래 머무는 단정한 아름다움.<br>남양주 진접에서 서울 · 경기까지, 커튼 · 블라인드 맞춤 시공</p>'
+ '      </div>'
+ '      <div class="footer-col">'
+ '        <h4>상담</h4>'
+ '        <p><a href="tel:' + C.phone + '">' + C.phone + '</a></p>'
+ '        <p><a href="mailto:' + C.email + '">' + C.email + '</a></p>'
+ '        <p>' + C.businessHours + '</p>'
+ '        <p>경기 남양주시 진접읍</p>'
+ '      </div>'
+ '      <div class="footer-col">'
+ '        <h4>바로가기</h4>'
+ '        <ul>' + navItems + '</ul>'
+ '      </div>'
+ '    </div>'
+ '    <div class="footer-areas">'
+ '      <h4><a href="areas.html">시공 지역 →</a></h4>'
+ '      <p class="footer-area-links">' + areaLinks + '</p>'
+ '    </div>'
+ '    <div class="footer-bottom">'
+ '      <p>' + bizLine + '</p>'
+ '      <p>© ' + new Date().getFullYear() + ' ' + C.companyNameEn + '. All Rights Reserved.</p>'
+ '    </div>'
+ '  </div>'
+ '</footer>';

/* ===== 하단 상담 섹션 (푸터 위, <div id="site-cta"></div> 자리에 들어감) ===== */
var ctaHTML = ''
+ '<section class="contact-cta" id="contact">'
+ '  <div class="bg"><img src="images/hero/hero-cta.jpg?v=202610172000" alt="" aria-hidden="true" loading="lazy"></div>'
+ '  <div class="container">'
+ '    <div>'
+ '      <p class="section-tag" style="color:var(--color-brass)">CONTACT</p>'
+ '      <h2>우리 집 창에 맞는 커튼,<br>창가에서 함께 고르세요</h2>'
+ '      <p class="sub">원단 샘플을 들고 찾아가 실측부터 견적까지 무료로 진행합니다.<br>남양주 진접에서 출발해 서울 · 경기 어디든 방문해요.</p>'
+ '    </div>'
+ '    <div class="channel-list">'
+ '      <a href="tel:' + C.phone + '" class="channel"><div><strong>전화 상담</strong><span>' + C.phone + ' · ' + C.businessHours + '</span></div><span class="go">→</span></a>'
+ '      <a href="' + C.kakaoUrl + '" class="channel" data-link="kakao"><div><strong>카카오톡 상담</strong><span>창문 사진을 보내주시면 빠르게 안내해 드려요</span></div><span class="go">→</span></a>'
+ '      <a href="inquiry.html" class="channel"><div><strong>온라인 견적 신청</strong><span>원하는 날짜에 방문 실측 예약</span></div><span class="go">→</span></a>'
+ '    </div>'
+ '  </div>'
+ '</section>';

/* ===== 플로팅 버튼 (PC: 우측 하단 / 모바일: 하단 고정 바) ===== */
var floatingHTML = ''
+ '<div class="floating-buttons">'
+ '  <a href="tel:' + C.phone + '" class="float-btn float-phone" aria-label="전화 상담"><span class="float-icon">☎</span><span class="float-label">전화</span></a>'
+ '  <a href="' + C.kakaoUrl + '" class="float-btn float-kakao btn-kakao" aria-label="카카오톡 상담"><span class="float-icon">💬</span><span class="float-label">카톡</span></a>'
+ '  <a href="inquiry.html" class="float-btn float-inquiry" aria-label="견적 문의"><span class="float-icon">✎</span><span class="float-label">견적</span></a>'
+ '</div>';

(function () {
  /* 1) 헤더 · 푸터 · 플로팅 주입 */
  var headerMount = document.getElementById("site-header");
  if (headerMount) headerMount.outerHTML = headerHTML;

  var ctaMount = document.getElementById("site-cta");
  if (ctaMount) ctaMount.outerHTML = ctaHTML;

  var footerMount = document.getElementById("site-footer");
  if (footerMount) footerMount.outerHTML = footerHTML;

  if (!document.querySelector(".floating-buttons") && !document.body.hasAttribute("data-no-floating")) {
    document.body.insertAdjacentHTML("beforeend", floatingHTML);
  }

  /* 2) 메인 히어로 슬라이드 */
  var home = document.querySelector('[data-hero="home"]');
  if (home && HOME_HERO_SLIDES.length) {
    var slides = HOME_HERO_SLIDES.map(function (s, i) {
      return '<figure class="hero-slide' + (i === 0 ? ' is-active' : '') + '">'
        + '<img src="' + s.img + '" alt="' + s.alt + '"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + '>'
        + '<figcaption>' + s.caption + '</figcaption></figure>';
    }).join("");
    var dots = HOME_HERO_SLIDES.map(function (s, i) {
      return '<button class="hero-dot' + (i === 0 ? ' is-active' : '') + '" aria-label="' + (i + 1) + '번째 사진"></button>';
    }).join("");
    home.insertAdjacentHTML("afterbegin", '<div class="hero-slides">' + slides + '</div><div class="hero-scrim"></div>');
    home.insertAdjacentHTML("beforeend", '<div class="hero-dots">' + dots + '</div>');
  }

  /* 3) 서브 페이지 히어로 (배경 · 영문 소제목 · 경로) */
  document.querySelectorAll(".page-hero[data-hero]").forEach(function (hero) {
    var cfg = PAGE_HEROES[hero.getAttribute("data-hero")];
    if (!cfg) return;
    var img = hero.getAttribute("data-hero-img") || cfg.img;   // 페이지별 사진 지정 가능
    hero.insertAdjacentHTML("afterbegin",
      '<div class="page-hero-bg"><img src="' + img + '" alt="" aria-hidden="true"></div><div class="page-hero-scrim"></div>');

    var inner = hero.querySelector(".container") || hero;
    var h1 = inner.querySelector("h1");
    var title = hero.getAttribute("data-crumb") || (h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "");
    if (h1) h1.insertAdjacentHTML("beforebegin", '<p class="page-hero-eyebrow">' + cfg.eyebrow + '</p>');

    var crumbs = [{ name: "홈", href: "index.html" }];
    if (cfg.parent) crumbs.push(cfg.parent);
    crumbs.push({ name: title });
    inner.insertAdjacentHTML("afterbegin", '<nav class="breadcrumb" aria-label="현재 위치">'
      + crumbs.map(function (c) { return c.href ? '<a href="' + c.href + '">' + c.name + '</a>' : '<span aria-current="page">' + c.name + '</span>'; }).join('<i>/</i>')
      + '</nav>');
  });

  /* 4) 현재 페이지 메뉴 강조 */
  var current = location.pathname.split("/").pop() || "index.html";
  var section = { "case": "gallery.html", area: "areas.html", post: "blog.html" };
  var heroEl = document.querySelector(".page-hero[data-hero]");
  var heroKey = heroEl ? heroEl.getAttribute("data-hero") : "";
  document.querySelectorAll(".main-nav a, .footer-col a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current || href === section[heroKey]) a.classList.add("is-current");
  });
})();
