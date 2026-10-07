/* =========================================================
   런던커튼 - 화면 동작 (메뉴, 슬라이드, 필터 등)
   includes.js 다음에 불러와야 합니다.
   ========================================================= */

// 모바일 메뉴 토글
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        menuToggle.setAttribute('aria-expanded', open);
    });
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => document.body.classList.remove('menu-open'));
    });
}

// 스크롤하면 헤더 배경 채우기
const header = document.getElementById('siteHeader');
if (header) {
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// 메인 히어로 슬라이드 (6초마다 넘김)
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
if (slides.length > 1) {
    let idx = 0;
    let timer;
    const show = (n) => {
        slides[idx].classList.remove('is-active');
        dots[idx] && dots[idx].classList.remove('is-active');
        idx = (n + slides.length) % slides.length;
        slides[idx].classList.add('is-active');
        dots[idx] && dots[idx].classList.add('is-active');
    };
    const play = () => { clearInterval(timer); timer = setInterval(() => show(idx + 1), 6000); };
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); play(); }));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
}

// 비포 & 애프터 슬라이더 (마우스 드래그 · 터치 · 키보드)
document.querySelectorAll('.ba-slider').forEach(slider => {
    const range = slider.querySelector('.ba-range');
    const set = v => { v = Math.max(0, Math.min(100, v)); slider.style.setProperty('--pos', v + '%'); range.value = v; };
    const fromEvent = e => { const r = slider.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    let dragging = false;
    slider.addEventListener('pointerdown', e => { dragging = true; slider.setPointerCapture(e.pointerId); fromEvent(e); });
    slider.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(t => slider.addEventListener(t, () => { dragging = false; }));
    range.addEventListener('input', e => set(+e.target.value));   // 키보드(←→) 조작
    set(+range.value);
});

// 시공사례 필터 (gallery.html)
const filterBtns = document.querySelectorAll('.filter-btn');
if (filterBtns.length) {
    const cards = document.querySelectorAll('.case-card[data-cat]');
    const apply = (cat) => {
        filterBtns.forEach(b => b.classList.toggle('is-active', b.dataset.filter === cat));
        cards.forEach(c => {
            c.hidden = !(cat === 'all' || c.dataset.cat.split(' ').includes(cat));
        });
    };
    filterBtns.forEach(btn => btn.addEventListener('click', () => {
        apply(btn.dataset.filter);
        history.replaceState(null, '', btn.dataset.filter === 'all' ? location.pathname : '#' + btn.dataset.filter);
    }));
    // gallery.html#blind 처럼 들어오면 해당 필터로 시작
    const hash = location.hash.replace('#', '');
    if (hash && document.querySelector('.filter-btn[data-filter="' + hash + '"]')) apply(hash);
}

// 스크롤하면 부드럽게 나타나기
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('is-in'));
}
