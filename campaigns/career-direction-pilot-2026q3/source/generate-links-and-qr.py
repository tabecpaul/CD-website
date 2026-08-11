#!/usr/bin/env python3
"""Generate the campaign link manifest and matching QR PNG/SVG files."""

from __future__ import annotations

import csv
import re
from pathlib import Path
from urllib.parse import urlencode

from PIL import Image, ImageDraw
from reportlab.graphics import renderSVG
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing

ROOT = Path(__file__).resolve().parents[1]
LANDING_URL = "https://start.careerdirect.kr/career-check"
CAMPAIGN = "career_direction_pilot_2026q3"
CONTENT_PATTERN = re.compile(r"^[a-z0-9_]+$")

ROWS = [
    ("naver_blog", "organic", "workbook", "naver_blog", "organic_content", "workbook_blog"),
    ("naver", "paid", "empathy_a", "naver", "cpc", "empathy_feed_a"),
    ("naver", "paid", "typography_b", "naver", "cpc", "typography_feed_b"),
    ("instagram", "organic", "empathy_a", "instagram", "organic_social", "empathy_feed_a"),
    ("instagram", "organic", "typography_b", "instagram", "organic_social", "typography_feed_b"),
    ("instagram", "paid", "empathy_a", "instagram", "paid_social", "empathy_feed_a"),
    ("instagram", "paid", "typography_b", "instagram", "paid_social", "typography_feed_b"),
    ("instagram", "organic", "empathy_story_a", "instagram", "organic_social", "empathy_story_a"),
    ("instagram", "organic", "typography_story_b", "instagram", "organic_social", "typography_story_b"),
    ("facebook", "organic", "empathy_a", "facebook", "organic_social", "empathy_feed_a"),
    ("facebook", "organic", "typography_b", "facebook", "organic_social", "typography_feed_b"),
    ("facebook", "paid", "empathy_a", "facebook", "paid_social", "empathy_feed_a"),
    ("facebook", "paid", "typography_b", "facebook", "paid_social", "typography_feed_b"),
    ("threads", "organic", "type_a", "threads", "organic_social", "threads_type_a"),
    ("threads", "organic", "type_b", "threads", "organic_social", "threads_type_b"),
    ("church", "partner", "poster", "church", "partner_qr", "faith_poster"),
    ("church", "partner", "mobile", "church", "partner_qr", "faith_mobile"),
    ("university", "partner", "poster", "university", "partner_qr", "university_poster"),
    ("university", "partner", "mobile", "university", "partner_qr", "university_mobile"),
]


def full_url(source: str, medium: str, content: str) -> str:
    if not CONTENT_PATTERN.fullmatch(content):
        raise ValueError(f"Invalid utm_content: {content}")
    return f"{LANDING_URL}?{urlencode({'utm_source': source, 'utm_medium': medium, 'utm_campaign': CAMPAIGN, 'utm_content': content})}"


def write_qr(url: str, stem: str) -> None:
    widget = qr.QrCodeWidget(url)
    x1, y1, x2, y2 = widget.getBounds()
    size = max(x2 - x1, y2 - y1)
    drawing = Drawing(size + 16, size + 16, transform=[1, 0, 0, 1, 8 - x1, 8 - y1])
    drawing.add(widget)
    renderSVG.drawToFile(drawing, str(ROOT / "qr" / "svg" / f"{stem}.svg"))
    widget.qr.make()
    matrix = widget.qr.modules
    quiet_zone = 4
    module_count = len(matrix) + quiet_zone * 2
    scale = max(1, 1200 // module_count)
    qr_size = module_count * scale
    canvas_size = max(1200, qr_size)
    offset = (canvas_size - qr_size) // 2 + quiet_zone * scale
    image = Image.new("RGB", (canvas_size, canvas_size), "white")
    pixels = ImageDraw.Draw(image)
    for row_index, row in enumerate(matrix):
        for column_index, dark in enumerate(row):
            if dark:
                left = offset + column_index * scale
                top = offset + row_index * scale
                pixels.rectangle((left, top, left + scale - 1, top + scale - 1), fill="black")
    image.save(ROOT / "qr" / "png" / f"{stem}.png", optimize=True)


def main() -> None:
    (ROOT / "links").mkdir(parents=True, exist_ok=True)
    (ROOT / "qr" / "png").mkdir(parents=True, exist_ok=True)
    (ROOT / "qr" / "svg").mkdir(parents=True, exist_ok=True)
    records = []
    seen = set()
    for channel, distribution, creative, source, medium, content in ROWS:
        key = (channel, distribution, creative)
        if key in seen:
            raise ValueError(f"Duplicate distribution key: {key}")
        seen.add(key)
        stem = f"qr-{channel}-{distribution}-{creative}"
        url = full_url(source, medium, content)
        write_qr(url, stem)
        records.append({
            "channel": channel,
            "distribution": distribution,
            "creative": creative,
            "utm_source": source,
            "utm_medium": medium,
            "utm_campaign": CAMPAIGN,
            "utm_content": content,
            "full_url": url,
            "qr_filename": f"{stem}.png",
        })
    with (ROOT / "links" / "campaign-links.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    print(f"Generated {len(records)} links and QR pairs")


if __name__ == "__main__":
    main()
