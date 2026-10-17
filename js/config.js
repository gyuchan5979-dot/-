/* ============================================
   런던커튼 - 사이트 설정
   여기만 수정하면 모든 페이지에 자동 반영됩니다!
   ★ 표시가 있는 항목은 실제 정보로 꼭 바꿔 주세요.
   ============================================ */

const SITE_CONFIG = {
    // 🌐 사이트 주소
    siteUrl: "https://londoncurtain.co.kr",

    // 📞 연락처 (바꿀 때는 HTML 안의 번호도 전체 찾아 바꾸기 또는 _build/common.py 의 PHONE 수정 후 재생성)
    phone: "010-6394-6285",
    email: "",

    // 💬 카카오 채널 ★ (비워 두면 카톡 버튼이 자동으로 숨겨집니다)
    kakaoUrl: "",

    // 📍 네이버 플레이스 (리뷰 보기 버튼에 연결, 없으면 "" 로 두면 버튼이 숨겨짐)
    naverPlaceUrl: "",

    // 📸 인스타그램 / 블로그 (없으면 "")
    instagramUrl: "",
    blogUrl: "",

    // 📋 Formspree (문의 폼) ★ formspree.io 에서 폼을 만들고 받은 ID 를 넣어 주세요
    //    비워 두면 신청 버튼을 눌렀을 때 전화 · 카톡 상담으로 안내합니다.
    formspreeId: "meaenjpn",
    formSubject: "[런던커튼] 새 견적 문의가 도착했습니다",

    // 🏢 회사 정보 ★
    companyName: "런던커튼",
    companyNameEn: "LONDON CURTAIN",
    legalName: "런던 커튼&블라인드",   // 사업자등록증의 상호
    ceo: "송민영",                // 대표자 이름
    bizNumber: "431-71-00596",   // 사업자등록번호
    address: "경기 남양주시 진접읍 · 서울 · 경기 방문 시공",

    // ⏰ 영업 시간
    businessHours: "연중무휴 상담"
};

// 페이지가 로드되면 자동으로 모든 링크에 설정값 적용
document.addEventListener('DOMContentLoaded', () => {

    // 1. 전화번호 링크 자동 설정
    document.querySelectorAll('a[href^="tel:"], [data-link="phone"]').forEach(el => {
        el.href = "tel:" + SITE_CONFIG.phone;
    });

    // 2. 이메일 링크 자동 설정 (이메일이 없으면 숨김)
    document.querySelectorAll('a[href^="mailto:"], [data-link="email"]').forEach(el => {
        if (SITE_CONFIG.email) el.href = "mailto:" + SITE_CONFIG.email;
        else (el.closest('p') || el).style.display = "none";
    });

    // 3. 카카오 채널 링크 자동 설정 (주소가 비어 있으면 버튼 숨김)
    document.querySelectorAll('.btn-kakao, [data-link="kakao"]').forEach(el => {
        if (SITE_CONFIG.kakaoUrl) {
            el.href = SITE_CONFIG.kakaoUrl;
            el.target = "_blank";
            el.rel = "noopener";
        } else {
            el.style.display = "none";
        }
    });

    // 4. 네이버 플레이스 링크 (주소가 비어 있으면 버튼 숨김)
    document.querySelectorAll('[data-link="naver"]').forEach(el => {
        if (SITE_CONFIG.naverPlaceUrl) {
            el.href = SITE_CONFIG.naverPlaceUrl;
            el.target = "_blank";
            el.rel = "noopener";
        } else {
            el.style.display = "none";
        }
    });

    // 5. Formspree 폼 자동 설정 (inquiry.html에서만 작동)
    const inquiryForm = document.querySelector('.inquiry-form');
    if (inquiryForm) {
        if (SITE_CONFIG.formspreeId) {
            inquiryForm.action = `https://formspree.io/f/${SITE_CONFIG.formspreeId}`;
            // 페이지 이동 없이 전송하고, 성공하면 우리 사이트의 완료 페이지로 이동
            // (Formspree 무료 요금제의 리디렉션 제한과 상관없이 작동)
            inquiryForm.addEventListener('submit', e => {
                e.preventDefault();
                const btn = inquiryForm.querySelector('button[type="submit"]');
                const label = btn ? btn.textContent : "";
                if (btn) { btn.disabled = true; btn.textContent = "전송 중..."; }
                const fail = () => {
                    if (btn) { btn.disabled = false; btn.textContent = label; }
                    alert("전송이 되지 않았습니다. 잠시 후 다시 시도하시거나\n전화 " + SITE_CONFIG.phone + " 로 연락 주세요.");
                };
                fetch(inquiryForm.action, {
                    method: "POST",
                    body: new FormData(inquiryForm),
                    headers: { "Accept": "application/json" }
                }).then(res => {
                    if (res.ok) location.href = "thanks.html";
                    else fail();
                }).catch(fail);
            });
        } else {
            inquiryForm.addEventListener('submit', e => {
                e.preventDefault();
                alert("온라인 신청서는 준비 중입니다.\n전화 " + SITE_CONFIG.phone + " 로 연락 주시면 바로 상담해 드릴게요.");
            });
        }
        const next = inquiryForm.querySelector('input[name="_next"]');
        if (next) next.value = SITE_CONFIG.siteUrl + "/thanks.html";
        const subject = inquiryForm.querySelector('input[name="_subject"]');
        if (subject) subject.value = SITE_CONFIG.formSubject;
    }

    // 6. 텍스트로 표시되는 전화번호 / 이메일 자동 업데이트
    document.querySelectorAll('[data-text="phone"]').forEach(el => {
        el.textContent = SITE_CONFIG.phone;
    });
    document.querySelectorAll('[data-text="email"]').forEach(el => {
        el.textContent = SITE_CONFIG.email;
    });
});
