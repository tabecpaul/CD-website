#!/usr/bin/env python3
"""Build deterministic campaign layouts from approved copy and source assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
PNG = ROOT / "creative" / "png"
JPG = ROOT / "creative" / "jpg"
PDF = ROOT / "creative" / "pdf"
SOURCE = ROOT / "creative" / "source"

FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
PHOTO = SOURCE / "empathy-young-professional-v1.png"
LOGO = REPO / "apps" / "www" / "public" / "career-direct-logo.png"
WORKBOOK = REPO / "apps" / "www" / "public" / "images" / "career-check" / "page-01.png"
CANVA_FEED_A = SOURCE / "canva-final-meta-feed-empathy-a.png"
CANVA_FEED_B = SOURCE / "canva-final-meta-feed-typography-b.png"

CREAM = "#F5F0E7"
NAVY = "#193B59"
NAVY_DARK = "#102D47"
TEAL = "#63C4CF"
TEAL_DARK = "#3B9DAB"
GOLD = "#D5A63E"
WHITE = "#FFFFFF"
INK = "#18344E"
MUTED = "#6F8292"


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size=size)


def fit_crop(image: Image.Image, size: tuple[int, int], centering=(0.5, 0.5)) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=centering)


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        current = ""
        for char in paragraph:
            trial = current + char
            if current and draw.textbbox((0, 0), trial, font=face)[2] > width:
                lines.append(current.rstrip())
                current = char.lstrip()
            else:
                current = trial
        lines.append(current)
    return lines


def text_block(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, face: ImageFont.FreeTypeFont,
               fill: str, width: int, spacing: int = 12, max_lines: int | None = None) -> int:
    lines = wrap(draw, text, face, width)
    if max_lines:
        lines = lines[:max_lines]
    x, y = xy
    line_height = face.size + spacing
    for line in lines:
        draw.text((x, y), line, font=face, fill=fill)
        y += line_height
    return y


def crop_logo() -> Image.Image:
    image = Image.open(LOGO).convert("RGBA")
    rgb = image.convert("RGB")
    mask = Image.new("L", image.size)
    pixels = mask.load()
    source = rgb.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b = source[x, y]
            pixels[x, y] = 255 if min(r, g, b) < 238 else 0
    bbox = mask.getbbox()
    return image.crop(bbox) if bbox else image


def place_logo(base: Image.Image, width: int, xy: tuple[int, int]) -> None:
    logo = crop_logo()
    height = round(logo.height * width / logo.width)
    logo = logo.resize((width, height), Image.Resampling.LANCZOS)
    base.alpha_composite(logo, xy)


def save(image: Image.Image, name: str) -> None:
    PNG.mkdir(parents=True, exist_ok=True)
    JPG.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(PNG / f"{name}.png", optimize=True)
    image.convert("RGB").save(JPG / f"{name}.jpg", quality=90, optimize=True, progressive=True)


def empathy(size: tuple[int, int], name: str, story: bool = False) -> None:
    w, h = size
    photo = fit_crop(Image.open(PHOTO), size, centering=(0.52, 0.5 if story else 0.43))
    photo = ImageEnhance.Color(photo).enhance(0.88).convert("RGBA")
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Readability panel and warm lower fade.
    panel_w = int(w * (0.70 if story else 0.68))
    od.rounded_rectangle((45, 45, panel_w, int(h * (0.57 if story else 0.60))), radius=34,
                         fill=(16, 45, 71, 225))
    od.rectangle((0, int(h * .76), w, h), fill=(16, 45, 71, 210))
    base = Image.alpha_composite(photo, overlay)
    draw = ImageDraw.Draw(base)
    margin = 78 if story else 70
    place_logo(base, int(w * .31), (margin, margin))
    draw.text((margin, int(h * .18)), "CAREER DIRECTION CHECK", font=font(int(w * .027)), fill=TEAL)
    headline = "왜 열심히 사는데\n진로 불안과\n번아웃을\n느끼나요?"
    y = text_block(draw, (margin, int(h * .24)), headline, font(int(w * (.062 if story else .058))), WHITE,
                   panel_w - margin * 2, spacing=int(w * .018))
    draw.text((margin, y + 18), "방향보다 자기이해가 먼저일 수 있습니다.", font=font(int(w * .027)), fill="#D8E8EE")
    button_y = int(h * .83)
    draw.rounded_rectangle((margin, button_y, margin + int(w * .53), button_y + int(h * .07)), radius=20, fill=GOLD)
    draw.text((margin + 26, button_y + int(h * .017)), "무료 12페이지 자가진단 받기", font=font(int(w * .031)), fill=NAVY_DARK)
    save(base, name)


def typography(size: tuple[int, int], name: str, story: bool = False, inverse: bool = False) -> None:
    w, h = size
    base = Image.new("RGBA", size, NAVY_DARK if inverse else CREAM)
    draw = ImageDraw.Draw(base)
    draw.ellipse((int(w * .67), -int(w * .14), int(w * 1.1), int(w * .29)), fill="#2E6178" if inverse else "#D5EFF1")
    draw.ellipse((-int(w * .15), int(h * .72), int(w * .26), int(h * .98)), fill="#866D36" if inverse else "#E8DDBE")
    margin = int(w * .075)
    place_logo(base, int(w * .32), (margin, margin))
    draw.text((margin, int(h * .19)), "진로가 흔들릴 때 필요한 첫 질문", font=font(int(w * .03)), fill=TEAL if inverse else TEAL_DARK)
    headline = "열심히 사는데도\n불안한 이유,\n방향보다 자기이해가\n먼저일 수 있습니다."
    y = text_block(draw, (margin, int(h * .27)), headline, font(int(w * (.067 if story else .061))), WHITE if inverse else NAVY_DARK,
                   int(w * .84), spacing=int(w * .022))
    draw.line((margin, y + 20, int(w * .42), y + 20), fill=GOLD, width=max(5, int(w * .008)))
    draw.text((margin, y + 56), "성격 · 흥미 · 재능 · 가치관", font=font(int(w * .032)), fill="#C4D3DD" if inverse else MUTED)
    button_y = int(h * .84)
    draw.rounded_rectangle((margin, button_y, int(w * .76), button_y + int(h * .07)), radius=20, fill=GOLD if inverse else NAVY)
    draw.text((margin + 28, button_y + int(h * .017)), "무료 워크북으로 점검하기", font=font(int(w * .031)), fill=NAVY_DARK if inverse else WHITE)
    save(base, name)


def naver_assets() -> None:
    # Representative banner.
    base = Image.new("RGBA", (1200, 628), CREAM)
    draw = ImageDraw.Draw(base)
    workbook = Image.open(WORKBOOK).convert("RGB")
    workbook = fit_crop(workbook, (355, 500), centering=(0.5, 0.1))
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((790, 80, 1170, 590), 22, fill=(16, 45, 71, 35))
    base = Image.alpha_composite(base, shadow)
    base.paste(workbook, (770, 60))
    draw = ImageDraw.Draw(base)
    place_logo(base, 270, (70, 58))
    draw.text((70, 165), "성격, 흥미, 재능, 가치관,", font=font(35), fill=TEAL_DARK)
    text_block(draw, (70, 222), "4가지 나침반으로\n진로 방향을 점검하세요.", font(58), NAVY_DARK, 650, spacing=15)
    draw.rounded_rectangle((70, 505, 540, 570), 18, fill=GOLD)
    draw.text((98, 520), "무료 12페이지 워크북", font=font(30), fill=NAVY_DARK)
    save(base, "naver-blog-hero-workbook")

    cards = [
        ("naver-card-01-reality", "현실 인식", "최근 가장 지쳤던 순간과\n에너지가 살아난 순간을 적어보세요."),
        ("naver-card-02-compass", "4가지 나침반", "성격 · 흥미 · 재능 · 가치관을\n한 가지씩 차분히 점검합니다."),
        ("naver-card-03-action", "작은 실행 계획", "퇴사 결론보다 먼저\n되돌릴 수 있는 실험을 설계하세요."),
    ]
    for index, (name, title, body) in enumerate(cards, 1):
        card = Image.new("RGBA", (1200, 675), WHITE)
        cd = ImageDraw.Draw(card)
        cd.rectangle((0, 0, 34, 675), fill=[TEAL, GOLD, NAVY][index - 1])
        cd.text((95, 85), f"0{index}", font=font(28), fill=TEAL_DARK)
        cd.text((95, 150), title, font=font(64), fill=NAVY_DARK)
        cd.line((95, 245, 420, 245), fill=GOLD, width=8)
        text_block(cd, (95, 310), body, font(38), INK, 980, spacing=18)
        cd.text((95, 585), "CAREER DIRECT KOREA · 진로 방향 자가진단", font=font(22), fill=MUTED)
        save(card, name)


def poster(channel: str, title: str, body: str, qr_name: str) -> None:
    mobile_size = (1080, 1350)
    a4_size = (2480, 3508)
    for size, suffix in ((mobile_size, "mobile"), (a4_size, "a4")):
        w, h = size
        base = Image.new("RGBA", size, CREAM)
        draw = ImageDraw.Draw(base)
        margin = int(w * .075)
        place_logo(base, int(w * .38), (margin, margin))
        label = "교회 · 청년부" if channel == "church" else "대학 · 학생단체"
        draw.text((margin, int(h * .15)), label, font=font(int(w * .032)), fill=TEAL_DARK)
        y = text_block(draw, (margin, int(h * .21)), title, font(int(w * .055)), NAVY_DARK,
                       int(w * .85), spacing=int(w * .025))
        draw.line((margin, y + int(w * .02), int(w * .48), y + int(w * .02)), fill=GOLD, width=max(7, int(w * .008)))
        body_y = y + int(w * .075)
        text_block(draw, (margin, body_y), body, font(int(w * .031)), INK, int(w * .84), spacing=int(w * .018))
        selected_qr = qr_name.replace("-poster.png", "-mobile.png") if suffix == "mobile" else qr_name
        qr_path = ROOT / "qr" / "png" / selected_qr
        qr_image = Image.open(qr_path).convert("RGB").resize((int(w * .29), int(w * .29)), Image.Resampling.NEAREST)
        qr_x, qr_y = margin, int(h * .70)
        base.paste(qr_image, (qr_x, qr_y))
        draw.text((qr_x + int(w * .34), qr_y + int(w * .035)), "QR을 스캔하고", font=font(int(w * .034)), fill=MUTED)
        draw.text((qr_x + int(w * .34), qr_y + int(w * .095)), "무료 워크북 받기", font=font(int(w * .048)), fill=NAVY_DARK)
        draw.text((qr_x + int(w * .34), qr_y + int(w * .175)), "12페이지 PDF · 이메일로 발송", font=font(int(w * .024)), fill=TEAL_DARK)
        draw.text((margin, int(h * .94)), "start.careerdirect.kr · Career Direct Korea", font=font(int(w * .024)), fill=MUTED)
        if suffix == "mobile":
            save(base, f"{channel}-mobile-poster")
        else:
            PNG.mkdir(parents=True, exist_ok=True)
            page_png = PNG / f"{channel}-a4-poster.png"
            base.convert("RGB").save(page_png, optimize=True)
            PDF.mkdir(parents=True, exist_ok=True)
            out = PDF / f"{channel}-a4-poster.pdf"
            pdf_canvas = canvas.Canvas(str(out), pagesize=A4)
            pdf_canvas.drawImage(ImageReader(base.convert("RGB")), 0, 0, width=A4[0], height=A4[1])
            pdf_canvas.showPage()
            pdf_canvas.save()


def main() -> None:
    for directory in (PNG, JPG, PDF):
        directory.mkdir(parents=True, exist_ok=True)
    if CANVA_FEED_A.exists():
        save(Image.open(CANVA_FEED_A).convert("RGBA"), "meta-feed-empathy-a")
    else:
        empathy((1080, 1080), "meta-feed-empathy-a")
    if CANVA_FEED_B.exists():
        save(Image.open(CANVA_FEED_B).convert("RGBA"), "meta-feed-typography-b")
    else:
        typography((1080, 1080), "meta-feed-typography-b")
    empathy((1080, 1920), "meta-story-empathy-a", story=True)
    typography((1080, 1920), "meta-story-typography-b", story=True)
    typography((1080, 1350), "threads-typography-a")
    # A restrained inverse-color variation for Threads B.
    typography((1080, 1350), "threads-typography-b", inverse=True)
    naver_assets()
    poster(
        "church",
        "하나님이 지으신 나를 발견하고\n일과 소명의 방향을 분별하세요.",
        "성격, 흥미, 재능, 가치관의 4가지 나침반으로\n나를 차분히 살펴보는 무료 진로 방향 자가진단입니다.",
        "qr-church-partner-poster.png",
    )
    poster(
        "university",
        "전공과 취업 사이에서 흔들릴 때,\n먼저 나를 이해하세요.",
        "성격, 흥미, 재능, 가치관의 4가지 나침반으로\n진로 방향을 점검하는 무료 12페이지 워크북입니다.",
        "qr-university-partner-poster.png",
    )
    print("Generated campaign creative exports")


if __name__ == "__main__":
    main()
