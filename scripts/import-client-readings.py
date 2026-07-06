#!/usr/bin/env python3
"""One-off import: content-source/client-readings/docx → src/content/recent-client-readings/."""

from __future__ import annotations

import re
import shutil
import subprocess
from collections import Counter
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parents[1]
DOCX_DIR = ROOT / "content-source/client-readings/docx"
PDF_DIR = ROOT / "content-source/client-readings/pdf"
OUT_DIR = ROOT / "src/content/recent-client-readings"
PUBLIC_PDF_DIR = ROOT / "public/downloads/client-readings"

CARD_PATTERN = re.compile(
    r"\b(?:The\s+(?:Fool|Magician|High Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|"
    r"Strength|Hermit|Wheel of Fortune|Justice|Hanged Man|Death|Temperance|Devil|Tower|Star|"
    r"Moon|Sun|Judgement|World)|Judgement|Justice|"
    r"(?:Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King)\s+of\s+"
    r"(?:Cups|Wands|Swords|Pentacles))\b",
    re.I,
)

SECTION_HEADERS = {
    "THE QUESTION",
    "THE LESSON",
    "THE ARCHETYPE: NOT A NO, JUST NOT YET",
    "THE ARCHETYPE: SETTING THE THESIS",
    "THE CORE READING",
    "THE CLARIFYING CARDS",
    "WHAT MAY THWART THE REBRAND",
    "WHAT WILL SUPPORT THE REBRAND",
    "THE HIDDEN PATTERN: TWO NUMERICAL STORIES",
    "THE FOUNDATION",
    "THE FIRST SIX MONTHS",
    "THE NEXT SIX MONTHS",
    "THE CLARIFICATION CARDS",
    "THE PRACTICAL PATH FORWARD",
    "CLOSING REFLECTION",
}

CARD_LINE_RE = re.compile(
    r"^(The\s+(?:Fool|Magician|High Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|"
    r"Strength|Hermit|Wheel of Fortune|Justice|Hanged Man|Death|Temperance|Devil|Tower|Star|"
    r"Moon|Sun|Judgement|World)|Judgement|Justice|"
    r"(?:Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King)\s+of\s+"
    r"(?:Cups|Wands|Swords|Pentacles))$",
    re.I,
)

EDITOR_NOTES_PLACEHOLDER = "_To be added._"
RELATED_SUGGESTIONS_PLACEHOLDER = "_To be added._"

KNOWN_ORACLE_CARDS = ["Time", "The Healer", "Protection"]

SKIP_PREFIXES = ("TIDES OF KNOWING", "tidesofknowing.com", "A Tarot Reading", "A Twelve-Month")


def extract_oracle_cards(text: str) -> list[str]:
    found: list[str] = []
    for name in KNOWN_ORACLE_CARDS:
        if re.search(rf"\b{re.escape(name)}\b", text):
            found.append(name)
    return found


def build_full_markdown_body(reading_content: str) -> str:
    reading = reading_content.strip()
    if not reading.startswith("# Reading"):
        reading = f"# Reading\n\n{reading}"
    return (
        f"{reading}\n\n"
        f"---\n\n"
        f"# Editor Notes\n\n{EDITOR_NOTES_PLACEHOLDER}\n\n"
        f"---\n\n"
        f"# Related Reading Suggestions\n\n{RELATED_SUGGESTIONS_PLACEHOLDER}\n"
    )


@dataclass
class ImportResult:
    slug: str
    title: str
    warnings: list[str] = field(default_factory=list)
    manual_review: list[str] = field(default_factory=list)


def title_case_card(match: re.Match[str]) -> str:
    raw = match.group(0)
    words = raw.split()
    out: list[str] = []
    for i, word in enumerate(words):
        if word.lower() == "of":
            out.append("of")
        elif i == 0 and word.lower() == "the":
            out.append("The")
        else:
            out.append(word.capitalize())
    return " ".join(out)


def extract_cards(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for match in CARD_PATTERN.finditer(text):
        card = title_case_card(match)
        key = card.lower()
        if key in seen:
            continue
        seen.add(key)
        found.append(card)
    return found


def suit_of(card: str) -> str:
    if " of " in card:
        return card.split(" of ")[-1]
    return "Major Arcana"


def dominant_suit(cards: list[str]) -> str:
    if not cards:
        return "Mixed"
    counts = Counter(suit_of(c) for c in cards)
    if len(counts) == 1:
        return next(iter(counts))
    top = counts.most_common(2)
    if len(top) > 1 and top[0][1] == top[1][1]:
        return "Mixed"
    return top[0][0]


def slug_from_stem(stem: str) -> str:
    return stem.lower().replace("_", "-")


def fix_encoding(text: str) -> str:
    return (
        text.replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "–")
        .replace("\u2014", "—")
        .replace("\ufffd", "'")
    )


def extract_question(paragraphs: list[str]) -> str | None:
    for i, para in enumerate(paragraphs):
        if para.strip().upper() == "THE QUESTION" and i + 1 < len(paragraphs):
            q = paragraphs[i + 1].strip().strip('"').strip("'").strip("“”‘’")
            return q
    return None


def extract_title(paragraphs: list[str], stem: str) -> str:
    for para in paragraphs:
        p = para.strip()
        if p.startswith("A Tarot Reading:"):
            return p.replace("A Tarot Reading:", "A Tarot Reading:").strip()
        if p.startswith("A Tarot Reading for "):
            return f"A Tarot Reading for {p.replace('A Tarot Reading for ', '').strip()}"
        if p.startswith("A Twelve-Month Reading for "):
            return p.strip()
    return stem.replace("_", " ")


def is_skip_line(text: str) -> bool:
    t = text.strip()
    if not t:
        return True
    if any(t.startswith(prefix) for prefix in SKIP_PREFIXES):
        return True
    if re.match(r"^\d{1,2}\s+\w+\s+\d{4}$", t):
        return True
    if "tidesofknowing.com" in t.lower():
        return True
    return False


def to_markdown_body(paragraphs: list[str]) -> str:
    lines: list[str] = []
    started = False

    for para in paragraphs:
        text = fix_encoding(para.strip())
        if not started:
            upper = text.upper()
            if upper in ("THE QUESTION", "THE LESSON") or upper.startswith("THE ARCHETYPE"):
                started = True
            else:
                continue

        if is_skip_line(text) and text.upper() not in SECTION_HEADERS:
            continue

        if text.upper() in SECTION_HEADERS:
            lines.append("")
            lines.append(f"## {text}")
            continue

        if CARD_LINE_RE.match(text):
            lines.append("")
            lines.append(f"## {text}")
            continue

        lines.append("")
        lines.append(text)

    body = "\n".join(lines).strip()
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body + "\n"


def yaml_string(value: str) -> str:
    if any(c in value for c in ':"\'\n#[]{}'):
        escaped = value.replace('"', '\\"')
        return f'"{escaped}"'
    return value


def card_pip_numbers(cards: list[str]) -> list[str]:
    word_to_num = {
        "ace": "1",
        "two": "2",
        "three": "3",
        "four": "4",
        "five": "5",
        "six": "6",
        "seven": "7",
        "eight": "8",
        "nine": "9",
        "ten": "10",
    }
    nums: list[str] = []
    seen: set[str] = set()
    for card in cards:
        first = card.split()[0].lower()
        if first in word_to_num:
            n = word_to_num[first]
            if n not in seen:
                seen.add(n)
                nums.append(n)
    return nums


def infer_reading_type(stem: str, text: str, cards: list[str]) -> tuple[str, list[str]]:
    warnings: list[str] = []
    upper = text.upper()
    if "TWELVE-MONTH" in stem.upper() or "TWELVE MONTH" in upper:
        return "Personal Guidance", warnings
    if "ONE QUESTION" in upper or (len(cards) <= 7 and "THE CORE READING" in upper):
        return "One Question", warnings
    if len(cards) >= 6:
        return "In-Depth", warnings
    warnings.append("Reading type inferred with low confidence.")
    return "In-Depth", warnings


def infer_spread(stem: str, text: str) -> tuple[str, list[str]]:
    warnings: list[str] = []
    upper = text.upper()
    if "TWELVE-MONTH" in stem.upper() or "TWELVE MONTH" in upper:
        return "Twelve Month Timeline", warnings
    if "THE CORE READING" in upper and "CLARIFYING" in upper:
        return "One Question", warnings
    if "LEFT THREE" in upper or "THWART" in upper:
        return "Custom", warnings
    warnings.append("Spread used inferred as Custom; confirm layout in source document.")
    return "Custom", warnings


def infer_life_areas(text: str, question: str | None) -> list[str]:
    blob = f"{text} {question or ''}".lower()
    areas: list[str] = []
    mapping = [
        ("Relationships", ["relationship", "partner", "love"]),
        ("Career", ["employment", "job", "workplace", "boss", "wages", "pay"]),
        ("Finance", ["money", "wages", "pay", "finance", "pentacles"]),
        ("Business", ["rebrand", "launch", "business", "tea blend", "brand"]),
        ("Health", ["rest", "recover", "body"]),
        ("Grief", ["anguish", "distress"]),
        ("Purpose", ["belong", "where you truly belong"]),
        ("Decision Making", ["obstacle", "support", "choose", "discernment"]),
        ("Family", ["family"]),
        ("Spiritual Growth", ["faith", "protected", "spirit"]),
        ("Creativity", ["creative"]),
    ]
    for area, keywords in mapping:
        if any(k in blob for k in keywords):
            areas.append(area)
    return areas[:4] if areas else ["Decision Making"]


def infer_themes(text: str) -> list[str]:
    blob = text.lower()
    themes: list[str] = []
    mapping = [
        ("Discernment", ["discernment", "choose consciously", "judgement"]),
        ("Threshold", ["threshold", "step up", "horizon"]),
        ("Healing", ["healer", "healing", "recover"]),
        ("Conflict", ["swords", "opposition", "thwart"]),
        ("Transition", ["rebrand", "launch", "timeline", "months"]),
        ("Transformation", ["transformation", "reduction", "potency"]),
        ("Integration", ["integration", "cohesive", "whole"]),
        ("Completion", ["world", "finish", "closing"]),
        ("Beginning", ["ace of wands", "new employment", "launch"]),
        ("Reorientation", ["belong", "rebrand", "direction"]),
    ]
    for theme, keywords in mapping:
        if any(k in blob for k in keywords):
            themes.append(theme)
    return themes[:4] if themes else ["Discernment"]


def infer_tags(title: str, reading_type: str, cards: list[str], areas: list[str]) -> list[str]:
    tags = [
        reading_type.lower(),
        "client reading",
        "anonymised tarot reading",
    ]
    for area in areas[:2]:
        tags.append(area.lower())
    if "wages" in title.lower() or "pay" in title.lower():
        tags.append("wages and payment")
    if "rebrand" in title.lower():
        tags.append("business rebrand")
    if "twelve-month" in title.lower():
        tags.append("twelve month timeline")
    return list(dict.fromkeys(tags))[:8]


def build_summary(question: str | None, title: str) -> str:
    if question:
        return f"An anonymised tarot reading exploring: {question}"
    return f"An anonymised tarot reading: {title}."


def build_seo_description(
    reading_type: str,
    question: str | None,
    cards: list[str],
    title: str,
) -> str:
    card_part = ", ".join(cards[:3]) if cards else "key tarot cards"
    if question:
        return (
            f"An anonymised {reading_type.lower()} tarot reading exploring {question} "
            f"with interpretive notes on {card_part}."
        )
    return (
        f"An anonymised {reading_type.lower()} tarot reading — {title} — "
        f"featuring {card_part}."
    )


def parse_date(paragraphs: list[str]) -> date:
    for para in paragraphs:
        m = re.match(r"^(\d{1,2})\s+(\w+)\s+(\d{4})$", para.strip())
        if m:
            day, month_name, year = m.groups()
            months = {
                "january": 1,
                "february": 2,
                "march": 3,
                "april": 4,
                "may": 5,
                "june": 6,
                "july": 7,
                "august": 8,
                "september": 9,
                "october": 10,
                "november": 11,
                "december": 12,
            }
            month = months.get(month_name.lower())
            if month:
                return date(int(year), month, int(day))
    return date.today()


def related_readings_for(slug: str, all_slugs: list[str]) -> list[str]:
    return [s for s in all_slugs if s != slug]


def import_reading(stem: str, all_slugs: list[str]) -> ImportResult:
    docx_path = DOCX_DIR / f"{stem}.docx"
    pdf_src = PDF_DIR / f"{stem}.pdf"
    slug = slug_from_stem(stem)
    warnings: list[str] = []
    manual: list[str] = []

    doc = Document(docx_path)
    paragraphs = [p.text for p in doc.paragraphs]
    full_text = "\n".join(paragraphs)
    full_text = fix_encoding(full_text)

    title = extract_title(paragraphs, stem)
    question = extract_question(paragraphs)
    if not question and "THE LESSON" in full_text.upper():
        manual.append("No explicit client question found; twelve-month reading uses THE LESSON framing.")
        question = "Twelve-month timeline reading (see document for full context)."

    cards = extract_cards(full_text)
    oracle_cards = extract_oracle_cards(full_text)
    if not cards:
        warnings.append("No standard tarot cards detected via pattern matching.")
    if oracle_cards:
        manual.append(
            f"Oracle/archetype cards detected ({', '.join(oracle_cards)}); stored in oracleCards metadata."
        )

    reading_type, w1 = infer_reading_type(stem, full_text, cards)
    spread, w2 = infer_spread(stem, full_text)
    warnings.extend(w1)
    warnings.extend(w2)

    overrides = {
        "shelly-wages-owed-reading": ("One Question", "One Question"),
        "hannah-rebrand-reading": ("In-Depth", "Custom"),
        "shelley-twelve-month-reading": ("Personal Guidance", "Twelve Month Timeline"),
    }
    if slug in overrides:
        reading_type, spread = overrides[slug]

    dom = dominant_suit(cards)
    life_areas = infer_life_areas(full_text, question)
    themes = infer_themes(full_text)
    tags = infer_tags(title, reading_type, cards, life_areas)
    published = parse_date(paragraphs)
    body = build_full_markdown_body(to_markdown_body(paragraphs))

    if re.search(r"\bfor (Hannah|Shelley|Shelly)\b", title, re.I):
        manual.append("Client first name appears in title; anonymise before setting publicationStatus to published.")
    if "Hi Hannah" in full_text:
        manual.append("Greeting uses client first name in body; anonymise before publication.")
    manual.append("clientConsentStatus defaults to pending; confirm consent before publication.")

    pdf_download = ""
    if pdf_src.exists():
        PUBLIC_PDF_DIR.mkdir(parents=True, exist_ok=True)
        pdf_dest = PUBLIC_PDF_DIR / f"{slug}.pdf"
        if not pdf_dest.exists():
            shutil.copy2(pdf_src, pdf_dest)
        pdf_download = f"/downloads/client-readings/{slug}.pdf"
    else:
        warnings.append(f"No matching PDF found at {pdf_src.name}.")

    primary = cards[:3]
    secondary = cards[3:6]
    featured = cards[:3]

    related = [s for s in related_readings_for(slug, all_slugs)]
    related_field: list[str] = []
    if "yes" in (question or "").lower() or "no" in (question or "").lower():
        related_field.append("why-i-rarely-start-with-yes-or-no-in-tarot")

    summary = build_summary(question, title)
    seo = build_seo_description(reading_type, question, cards, title)

    suits = sorted({suit_of(c) for c in cards if " of " in c})
    numbers = card_pip_numbers(cards)

    frontmatter = f"""---
title: {yaml_string(title)}
slug: {slug}
datePublished: {published.isoformat()}
dateModified: {published.isoformat()}
readingType: {reading_type}
question: {yaml_string(question or "See reading for context.")}
clientConsentStatus: pending
publicationStatus: draft
summary: >-
  {summary}
seoDescription: >-
  {seo}
pdfDownload: {yaml_string(pdf_download) if pdf_download else '""'}
spreadImages:
  []
featured: false
cardsFeatured:
{chr(10).join(f"  - {c}" for c in featured) if featured else "  []"}
primaryCards:
{chr(10).join(f"  - {c}" for c in primary) if primary else "  []"}
secondaryCards:
{chr(10).join(f"  - {c}" for c in secondary) if secondary else "  []"}
spreadUsed: {spread}
lifeAreas:
{chr(10).join(f"  - {a}" for a in life_areas)}
dominantSuit: {dom}
archetypalThemes:
{chr(10).join(f"  - {t}" for t in themes)}
oracleCards:
{chr(10).join(f"  - {c}" for c in oracle_cards) if oracle_cards else "  []"}
relatedCards:
{chr(10).join(f"  - {c}" for c in cards) if cards else "  []"}
relatedSuits:
{chr(10).join(f"  - {s}" for s in suits) if suits else "  []"}
relatedNumbers:
{chr(10).join(f'  - "{n}"' for n in numbers) if numbers else "  []"}
relatedSpreads:
  - {spread}
relatedFieldNotes:
{chr(10).join(f"  - {f}" for f in related_field) if related_field else "  []"}
relatedReadings:
{chr(10).join(f"  - {r}" for r in related) if related else "  []"}
tags:
{chr(10).join(f"  - {t}" for t in tags)}
---

"""

    out_path = OUT_DIR / f"{slug}.md"
    out_path.write_text(frontmatter + body, encoding="utf-8")

    sync_script = ROOT / "scripts/sync-client-reading-spread-images.mjs"
    if sync_script.exists():
        subprocess.run(
            ["node", str(sync_script), f"--slug={slug}"],
            cwd=ROOT,
            check=False,
        )

    return ImportResult(slug=slug, title=title, warnings=warnings, manual_review=manual)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Import client reading DOCX files.")
    parser.add_argument(
        "--stem",
        help="Import a single DOCX stem only (e.g. Sasha_Two_Jobs_Reading)",
    )
    args = parser.parse_args()

    stems = sorted(p.stem for p in DOCX_DIR.glob("*.docx"))
    if not stems:
        print("No DOCX files found.")
        return

    if args.stem:
        if args.stem not in stems:
            print(f"DOCX not found: {args.stem}.docx")
            raise SystemExit(1)
        stems = [args.stem]

    slugs = [slug_from_stem(s) for s in sorted(p.stem for p in DOCX_DIR.glob("*.docx"))]
    results = [import_reading(stem, slugs) for stem in stems]

    print("IMPORTED:")
    for r in results:
        print(f"  - {r.slug} ({r.title})")
    print("\nWARNINGS:")
    any_warn = False
    for r in results:
        for w in r.warnings:
            any_warn = True
            print(f"  [{r.slug}] {w}")
    if not any_warn:
        print("  None")
    print("\nMANUAL REVIEW:")
    any_manual = False
    for r in results:
        for m in r.manual_review:
            any_manual = True
            print(f"  [{r.slug}] {m}")
    if not any_manual:
        print("  None")


if __name__ == "__main__":
    main()
