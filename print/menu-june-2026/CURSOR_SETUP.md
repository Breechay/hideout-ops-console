# Hideout Print System — Cursor Setup

Canonical path: `hideout-ops-console/print/menu-june-2026/`

Give this file to Cursor when setting up or extending the print package.

---

## Folder structure (already created)

```
print/menu-june-2026/
├── design-decisions/     ← 00–05 master package (read first)
├── mockups/              ← concept PNGs + HTML family views
├── placements/           ← per-piece drill-down (01–07)
├── ai-prompts/           ← 04_AI_PROMPTS.md (duplicate of design-decisions)
├── prompts/              ← legacy prompt shards
├── references/           ← menu bg, specs, inspiration
├── qr-codes/             ← SVG QR exports (operator generates)
├── psd-templates/        ← Photoshop masters (build day)
└── exports/              ← print-ready PDFs out
```

If any folder is missing:

```bash
cd /path/to/hideout-ops-console/print/menu-june-2026
mkdir -p design-decisions mockups placements ai-prompts references/photos \
  psd-templates exports qr-codes
```

---

## Design package (canonical)

All live in `design-decisions/`:

| File | Contents |
|------|----------|
| `00_MASTER_ART_DIRECTION.md` | Visual philosophy — filter every decision |
| `06_LAYOUT_DOCTRINE.md` | Editorial single-column vs menu two-column (locked) |
| `01_BRAND_SYSTEM.md` | Tokens, type scale, CMYK, print specs |
| `02_MINI_FLYER.md` | One asset, five channels, both sides |
| `03_PLACEMENTS.md` | All seven cards + summary table |
| `04_AI_PROMPTS.md` | Mood boards + background prompts + do-not-generate |
| `05_PHOTOSHOP_BUILD_GUIDE.md` | Layer structure, export, vendor block |

Root-level `00_*.md` / `01_*.md` / `05_*.md` are legacy pointers — **edit `design-decisions/` only.**

---

## Assets to copy into `references/`

From operator machine (when available):

| Source | Destination |
|--------|-------------|
| `menu-background-family-grid.jpg` | `references/menu-background-family-grid.jpg` ← **default** |
| `menu-background-v3.jpg` | `references/menu-background-v3.jpg` ← dramatic slate |
| `menu-background-v3-mockup.jpg` | `references/menu-background-v3-mockup.jpg` ← from Watermarc mockups |
| `menu-background-v3-soft.jpg` | `references/menu-background-v3-soft.jpg` |
| `menu-background-v2.jpg` | `references/menu-background-v2.jpg` ← original stone, darkened |
| `menu-background-v2-square.jpg` | `references/menu-background-v2-square.jpg` |
| `menu-background.jpg` (v1) | `references/menu-background-v1-archived.jpg` |
| `column-boards-render.png` | `references/column-boards-render.png` |
| `menu-june-2026-food-inspector-approved.pdf` | `references/menu-approved.pdf` |

Background treatment: `references/menu_background_treatment.md` — darken midtones ~15%, warm lean → `#14120F`.

---

## QR codes → `qr-codes/`

Generate at qr-code-generator.com or qrmonkey.com (SVG, square modules, dark on white, M correction):

| File | URL |
|------|-----|
| `qr-nfc.svg` | `https://hideoutmiami.com/app?source=nfc` |
| `qr-skyview.svg` | `https://hideoutmiami.com/app?source=skyview` |
| `qr-watermarc.svg` | `https://hideoutmiami.com/app?source=watermarc` |
| `qr-neighbor.svg` | `https://hideoutmiami.com/app?source=neighbor` |
| `qr-weekday.svg` | `https://hideoutmiami.com/app?source=weekday` |
| `qr-village.svg` | `https://hideoutmiami.com/app?source=village` |
| `qr-office.svg` | `https://hideoutmiami.com/app?source=office` |

**Sunday exit card uses `qr-weekday.svg`** — not village.

`village` = in-room Sunday gathering only (Sunday tab). Shipped in HideoutApp.

---

## App routing (confirmed — no blocker)

| Source | Tab | Use |
|--------|-----|-----|
| `weekday` / `sundayexit` | Today | Sunday exit bridge cards |
| `village` | Sunday | In-room gathering QR only |
| `nfc`, `skyview`, `watermarc`, `neighbor`, `office` | Per placement | See `03_PLACEMENTS.md` |

Code: `HideoutApp/HideoutApp/Core/HideoutStore.swift` → `weekdayBridge` launch source.

---

## Mockups saved

| Path | What |
|------|------|
| `mockups/01–09_*.png` | Per-piece concept renders |
| `mockups/10_background_darkening_comparison.png` | Menu bg A/B |
| `mockups/hideout_full_print_family.html` | Full family side-by-side (Claude) |
| `mockups/hideout_app_mockup*.html` | App UI reference (INCREMENTS archive) |

Open `hideout_full_print_family.html` in browser for the family test.

---

## Photoshop day read order

1. `design-decisions/00_MASTER_ART_DIRECTION.md`
2. `design-decisions/01_BRAND_SYSTEM.md`
3. Piece spec: `design-decisions/02_MINI_FLYER.md` or `design-decisions/03_PLACEMENTS.md`
4. `design-decisions/04_AI_PROMPTS.md` → mood board first
5. `design-decisions/05_PHOTOSHOP_BUILD_GUIDE.md` → assemble
6. Export → `exports/`

Week 1 print (unilateral): SkyView lobby + Counter NFC + mini flyer bag inserts.
