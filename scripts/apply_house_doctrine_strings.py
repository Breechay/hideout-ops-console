#!/usr/bin/env python3
"""Apply Hideout house doctrine string updates across HTML console files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REPLACEMENTS = [
    (
        "None can replicate Sunday DJ brunch or your personal ownership. Their edge: longer hours and chain marketing. Your edge: product quality, community, and the experience they cannot copy.",
        "None can replicate six years of house coherence or the Sunday room. Their edge: longer hours and chain marketing. Your edge: conditions people trust — calm, quality, and rooms that belong together.",
    ),
    (
        "Convert the space from a café that occasionally has music into a neighborhood place that reliably sounds a certain way on Sundays. Habit installation, not acquisition. Structure → Repeat → Let it compound.",
        "Sunday is one room in the house — fixed infrastructure, not a venue add-on. Habit installation, not acquisition. Structure → Repeat → Let it compound.",
    ),
    (
        '"It\'s your first Hideout Sunday? Most people end up staying for at least two rounds — grab a spot near the DJ."',
        '"First Hideout Sunday? Most people stay longer than they planned — find a spot, listen, let it settle."',
    ),
    (
        'Add one anchor item at $24–26 (e.g. "Founder\'s Bowl" — your best bowl, maximum toppings)',
        'Add one anchor item at $24–26 (e.g. "Anchor Bowl" — premium build, maximum toppings)',
    ),
    (
        'Add "Founder\'s Bowl" at $26 — your best bowl, maximum build',
        'Add "Anchor Bowl" at $26 — premium build, maximum toppings',
    ),
    (
        'placeholder="you@yourcafe.com"',
        'placeholder="you@hideoutmiami.com"',
    ),
]

HTML_FILES = [
    ROOT / "hideout_console_v16.html",
    ROOT / "console-web" / "index.html",
    ROOT / "outputs" / "hideout_console_v9.html",
    ROOT / "console-web" / "scripts" / "extract-from-html.mjs",
]


def main() -> None:
    for path in HTML_FILES:
        if not path.exists():
            print(f"skip (missing): {path}")
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"updated: {path}")
        else:
            print(f"unchanged: {path}")


if __name__ == "__main__":
    main()
