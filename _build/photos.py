"""받은 시공 사진(_build/photos-src)을 사이트용으로 자르고 줄여서 images/ 에 저장.

실행: python3 _build/photos.py
- 위치 정보(EXIF)는 저장하지 않음
- 창밖 아파트 이름, 가족사진처럼 남의 정보가 보이는 곳은 흐리게 처리하거나 잘라냄
"""
import os
from PIL import Image, ImageFilter, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_build", "photos-src")
OUT = os.path.join(ROOT, "images")

# 흐림 처리할 영역 (원본 좌표)
BLUR = {
    "8": [(770, 690, 870, 775), (1195, 675, 1260, 730), (1195, 920, 1260, 975)],   # 창밖 아파트 단지명 · 동번호
    "42": [(1425, 290, 1525, 355)],                                                   # 창밖 동번호
    "34": [(1515, 1235, 1725, 1295)],                                                 # 책상 위 이름표
    "22": [(0, 1050, 300, 1500), (1000, 1250, 1300, 1500)],                           # 서류철 글씨
}


def load(n):
    im = Image.open(os.path.join(SRC, f"{n}.jpg")).convert("RGB")
    for box in BLUR.get(str(n), []):
        im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(14)), box[:2])
    return im


def fit(im, aspect, box=None, focus=(0.5, 0.5)):
    """box 안에서 aspect(가로/세로) 비율로 가장 크게 자르기. focus 는 잘라낼 때 기준점"""
    x0, y0, x1, y1 = box or (0, 0, im.width, im.height)
    w, h = x1 - x0, y1 - y0
    if w / h > aspect:
        nw = round(h * aspect)
        x0 += round((w - nw) * focus[0]); x1 = x0 + nw
    else:
        nh = round(w / aspect)
        y0 += round((h - nh) * focus[1]); y1 = y0 + nh
    return im.crop((x0, y0, x1, y1))


def save(im, rel, size):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if im.width > size[0]:
        im = im.resize(size, Image.LANCZOS)
    im.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{rel:38s} {im.size[0]}x{im.size[1]}  {os.path.getsize(path) // 1024}KB")


HERO = (1920, 1080)
WIDE = 16 / 9

# ---------- 메인 슬라이드 · 서브 페이지 배경 (16:9) ----------
HEROES = {
    "hero/hero-01.jpg":       ("4",  None,                    (0.5, 0.3)),
    "hero/hero-02.jpg":       ("9",  None,                    (0.5, 0.2)),
    "hero/hero-03.jpg":       ("3",  (0, 0, 2000, 1380),      (0.5, 0.0)),
    "hero/hero-gallery.jpg":  ("14", None,                    (0.5, 0.35)),
    "hero/hero-products.jpg": ("12", None,                    (0.5, 0.2)),
    "hero/hero-areas.jpg":    ("8",  None,                    (0.5, 0.3)),
    "hero/hero-blog.jpg":     ("18", None,                    (0.5, 0.3)),
    "hero/hero-about.jpg":    ("11", None,                    (0.5, 0.1)),
    "hero/hero-faq.jpg":      ("10", (480, 0, 2000, 1080),    (0.5, 0.0)),
    "hero/hero-inquiry.jpg":  ("19", (0, 250, 1340, 1300),    (0.5, 0.3)),
    "hero/hero-cta.jpg":      ("17", (230, 0, 1770, 1150),    (0.5, 0.0)),
}

# ---------- 제품 (세로 3:4) ----------
PRODUCTS = {
    "products/linen.jpg":    ("product-linen", (300, 30, 945, 896), (0.5, 0.0)),   # 린넨 커튼 실제 시공 사진 (case-38)
    "products/chiffon.jpg":  ("9",  (950, 0, 2000, 1500),     (0.5, 0.0)),
    "products/blackout.jpg": ("13", (300, 0, 1600, 1500),     (0.5, 0.0)),
    "products/wood.jpg":     ("6",  (500, 0, 1800, 1300),     (0.5, 0.0)),
    "products/roll.jpg":     ("5",  (150, 0, 1300, 1500),     (0.5, 0.0)),
    "products/combi.jpg":    ("27", (560, 300, 1480, 1420),   (0.5, 0.3)),
    "products/honeycomb.jpg": ("46", (560, 230, 1330, 1300),  (0.5, 0.0)),
}

# ---------- 시공 전후 대신: 우드 블라인드 열었을 때 / 닫았을 때 ----------
BA = {
    "before-after/before-slide.jpg": ("6", (180, 0, 1900, 1340)),
    "before-after/after-slide.jpg":  ("7", (180, 0, 1900, 1340)),
}

# ---------- 브랜드 소개 (세로 4:5) ----------
ABOUT = {
    "about/about-01.jpg": ("12", (200, 0, 1500, 1500), (0.5, 0.0)),
    "about/about-02.jpg": ("17", (230, 0, 1500, 1170), (0.5, 0.0)),
}

# ---------- 시공사례 (4:3) : 사례번호 → [(사진, 자를 영역)] ----------
CASES = {
    "01": [("4",  None)],
    "02": [("3",  (0, 0, 2000, 1400))],
    "03": [("5",  None)],
    "04": [("6",  (150, 0, 1950, 1400)), ("7", (150, 0, 1950, 1400))],
    "05": [("13", (150, 120, 1600, 1250))],
    "06": [("9",  None)],
    "07": [("11", None)],
    "08": [("14", None)],
    "09": [("17", (220, 0, 1770, 1165))],
    "10": [("8",  None)],
    "11": [("12", None)],
    "12": [("15", (250, 0, 1650, 1050))],
    "13": [("16", None)],
    "14": [("10", (480, 0, 2000, 1140))],
    "15": [("18", None)],
    "16": [("19", (0, 220, 1340, 1225))],
    "17": [("20", None), ("21", None)],
    "18": [("22", (200, 0, 2000, 1050))],
    "19": [("23", (330, 0, 1700, 1280))],
    "20": [("24", None)],
    "21": [("25", None)],
    "22": [("26", (250, 0, 1950, 1250))],
    "23": [("27", None)],
    "24": [("28", None), ("29", None)],
    "25": [("30", None)],
    "26": [("31", None)],
    "27": [("32", (0, 0, 2000, 1100))],
    "28": [("34", (0, 0, 2000, 1210))],
    "29": [("35", None), ("36", None)],
    "30": [("37", None)],
    "31": [("38", None), ("39", None)],
    "32": [("41", None)],
    "33": [("42", None)],
    "34": [("43", None)],
    "35": [("44", None)],
    "36": [("45", (250, 0, 1820, 1300))],
    "37": [("46", (0, 0, 1450, 1250))],
    "38": [("product-linen", None)],
    "39": [("product-motor", None)],
}


def tile(rel, title, sub):
    """사진이 아직 없는 제품용 브랜드 이미지 (로고 + 제품명)"""
    w, h = 900, 1200
    img = Image.new("RGB", (w, h), (28, 38, 51))
    d = ImageDraw.Draw(img)
    logo = Image.open(os.path.join(OUT, "brand", "logo-icon.png"))
    logo.thumbnail((360, 360), Image.LANCZOS)
    img.paste(logo, ((w - logo.width) // 2, 300), logo)
    ko = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 58)
    en = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 30)
    d.text(((w - d.textlength(title, font=ko)) / 2, 760), title, font=ko, fill=(201, 165, 98))
    d.text(((w - d.textlength(sub, font=en)) / 2, 850), sub, font=en, fill=(200, 196, 188))
    save(img, rel, (w, h))


if __name__ == "__main__":
    for rel, (n, box, focus) in HEROES.items():
        save(fit(load(n), WIDE, box, focus), rel, HERO)
    for rel, (n, box, focus) in PRODUCTS.items():
        save(fit(load(n), 3 / 4, box, focus), rel, (900, 1200))
    for rel, (n, box) in BA.items():
        save(fit(load(n), 1440 / 1122, box, (0.5, 0.0)), rel, (1440, 1122))
    for rel, (n, box, focus) in ABOUT.items():
        save(fit(load(n), 4 / 5, box, focus), rel, (1000, 1250))
    for no, photos in CASES.items():
        for i, (n, box) in enumerate(photos):
            rel = f"cases/case-{no}.jpg" if i == 0 else f"cases/case-{no}-{i + 1}.jpg"
            save(fit(load(n), 4 / 3, box, (0.5, 0.3)), rel, (1600, 1200))
    save(fit(load("product-motor"), 3 / 4, (240, 0, 960, 896), (0.5, 0.0)), "products/motor.jpg", (900, 1200))   # 전동 커튼 · 롤스크린 실제 시공 사진 (case-39)
