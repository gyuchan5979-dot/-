"""자리표시용 사진 생성 (실제 사진이 들어오면 같은 파일명으로 덮어쓰기).

이미 실제 사진으로 바꾼 파일은 건드리지 않도록, 파일이 없을 때만 만듭니다.
전부 다시 만들려면: python3 _build/placeholders.py --force
og-image.jpg 는 공유 미리보기용 완성 이미지입니다.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KO = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FORCE = "--force" in sys.argv

NAVY = (28, 38, 51)
BRASS = (184, 149, 94)

TONES = [  # (위, 아래) 그라데이션
    ((122, 116, 104), (74, 72, 68)),
    ((104, 112, 120), (58, 66, 76)),
    ((138, 126, 108), (86, 78, 66)),
    ((96, 104, 98), (56, 62, 60)),
]

IMAGES = [
    # 경로, 크기, 표시 문구
    ("hero/hero-01.jpg", (1920, 1080), "메인 슬라이드 1 · 거실 커튼"),
    ("hero/hero-02.jpg", (1920, 1080), "메인 슬라이드 2 · 안방"),
    ("hero/hero-03.jpg", (1920, 1080), "메인 슬라이드 3 · 블라인드"),
    ("hero/hero-gallery.jpg", (1920, 1080), "시공사례 배경"),
    ("hero/hero-products.jpg", (1920, 1080), "제품 배경"),
    ("hero/hero-areas.jpg", (1920, 1080), "시공지역 배경"),
    ("hero/hero-blog.jpg", (1920, 1080), "매거진 배경"),
    ("hero/hero-about.jpg", (1920, 1080), "브랜드 배경"),
    ("hero/hero-faq.jpg", (1920, 1080), "FAQ 배경"),
    ("hero/hero-inquiry.jpg", (1920, 1080), "견적문의 배경"),
    ("hero/hero-cta.jpg", (1920, 1080), "하단 상담 배경"),
    ("before-after/before-slide.jpg", (1440, 1122), "BEFORE · 시공 전 (같은 위치 · 같은 구도)"),
    ("before-after/after-slide.jpg", (1440, 1122), "AFTER · 시공 후 (같은 위치 · 같은 구도)"),
    ("about/about-01.jpg", (1000, 1250), "브랜드 사진 1 · 상담 모습"),
    ("about/about-02.jpg", (1000, 1250), "브랜드 사진 2 · 시공 모습"),
    ("products/linen.jpg", (900, 1200), "린넨 커튼"),
    ("products/chiffon.jpg", (900, 1200), "쉬폰 커튼"),
    ("products/blackout.jpg", (900, 1200), "암막 커튼"),
    ("products/combi.jpg", (900, 1200), "콤비 블라인드"),
    ("products/wood.jpg", (900, 1200), "우드 블라인드"),
    ("products/honeycomb.jpg", (900, 1200), "허니콤 블라인드"),
    ("products/roll.jpg", (900, 1200), "롤스크린"),
    ("products/motor.jpg", (900, 1200), "전동 커튼 · 블라인드"),
]
# 시공사례 사진은 _build/photos.py 가 실제 사진으로 만듭니다.


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", size, top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[k] + (bottom[k] - top[k]) * t) for k in range(3)))
    # 커튼 주름 느낌의 세로 음영
    over = Image.new("L", size, 0)
    od = ImageDraw.Draw(over)
    step = max(w // 24, 30)
    for x in range(0, w, step):
        od.rectangle([x, 0, x + step // 2, h], fill=18)
    return Image.composite(Image.new("RGB", size, (0, 0, 0)), img, over)


def placeholder(rel, size, label, tone):
    path = os.path.join(ROOT, "images", rel)
    if os.path.exists(path) and not FORCE:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = gradient(size, *tone)
    d = ImageDraw.Draw(img)
    w, h = size
    base = min(w, h)
    scale = 0.7 if rel.startswith("hero/") else 1
    f_label = ImageFont.truetype(KO, int(base * 0.045 * scale))
    f_small = ImageFont.truetype(KO, int(base * 0.026 * scale))
    f_brand = ImageFont.truetype(SERIF, int(base * 0.03))
    lines = [(label, f_label, (255, 255, 255)),
             (f"images/{rel}", f_small, (230, 226, 218)),
             (f"권장 {w}×{h} · 같은 파일명으로 덮어쓰기", f_small, (210, 205, 196))]
    total = sum(d.textbbox((0, 0), t, font=f)[3] for t, f, _ in lines) + base * 0.05
    is_hero = rel.startswith("hero/")
    y = h * 0.16 if is_hero else (h - total) / 2      # 히어로는 제목과 겹치지 않게 오른쪽 위
    for t, f, c in lines:
        bw = d.textlength(t, font=f)
        x = w - bw - w * 0.06 if is_hero else (w - bw) / 2
        d.text((x, y), t, font=f, fill=c)
        y += d.textbbox((0, 0), t, font=f)[3] + base * 0.025
    brand = "LONDON CURTAIN · PLACEHOLDER"
    d.text(((w - d.textlength(brand, font=f_brand)) / 2, h - base * 0.09), brand, font=f_brand, fill=BRASS)
    img.save(path, "JPEG", quality=72, optimize=True, progressive=True)
    return True


def og_image():
    """공유 미리보기: 로고(images/brand/logo-full.png)를 네이비 배경 가운데에"""
    path = os.path.join(ROOT, "images", "og-image.jpg")
    if os.path.exists(path) and not FORCE:
        return False
    logo = Image.open(os.path.join(ROOT, "images", "brand", "logo-full.png"))
    og = Image.new("RGB", (1200, 630), (10, 20, 32))
    logo.thumbnail((560, 520), Image.LANCZOS)
    og.paste(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2), logo)
    og.save(path, "JPEG", quality=90)
    return True


if __name__ == "__main__":
    made = 0
    for i, (rel, size, label) in enumerate(IMAGES):
        made += placeholder(rel, size, label, TONES[i % len(TONES)])
    made += og_image()
    print(f"{made} images written")
