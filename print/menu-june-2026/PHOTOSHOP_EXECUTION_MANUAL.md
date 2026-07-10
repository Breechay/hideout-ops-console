# Hideout Miami — Photoshop Execution Manual
## Open this file. Execute in order. Do not decide — assemble.

**Package:** `hideout-ops-console/print/menu-june-2026/`  
**Phase:** Distribution & Rhythm · June 2026

---

## 0. Before you open Photoshop (checklist)

- [ ] Fonts installed (Section 1)
- [ ] Color swatches loaded or hex values copied (Section 2)
- [ ] Background chosen and file path noted (Section 3)
- [ ] 7 QR SVGs in `qr-codes/` (Section 4)
- [ ] Open `psd-templates/*.psd` directly (10 files ready)
- [ ] `exports/` folder exists
- [ ] iPhone ready for QR scan test before any print order
- [ ] **`COPY_FINAL.md` open** — edited text, no design noise

**Do not print Sunday exit cards with `?source=village`.** Use `qr-weekday.svg` only.

**Layout doctrine:** Editorial pieces = single column. Menu middle board = two column only. See `design-decisions/06_LAYOUT_DOCTRINE.md`.

---

## 1. Fonts (install these exact files)

| Role | Font name | Weight / style | Used for |
|------|-----------|----------------|----------|
| **Display** | `Cormorant Garamond` | *Italic* | Headlines, primary message, large wordmark |
| **Display small** | `Cormorant Garamond` | Regular (not italic) | Logo wordmark under ~18pt |
| **Body** | `DM Sans` | Regular | Descriptions, body, secondary lines |
| **Label** | `DM Sans` | Medium | Category labels, eyebrows (ALL CAPS) |
| **Utility** | `DM Mono` | Regular | Prices, hours, URLs, codes |

**Install source:** [Google Fonts](https://fonts.google.com) — Cormorant Garamond, DM Sans, DM Mono.

**Fallbacks (only if above missing):**
- Cormorant → Playfair Display Italic
- DM Sans → Inter or Helvetica Neue
- DM Mono → IBM Plex Mono

---

## 2. Colors (copy into Photoshop swatches)

### Screen / Photoshop hex (RGB mode reference)

| Swatch name | Hex | Use |
|-------------|-----|-----|
| Void | `#0E0C0A` | Base fill, void overlay |
| Board black | `#1C1A18` | QR modules, inset panels |
| Surface | `#242220` | Rare — avoid in print |
| Cream | `#F5ECD7` | Primary type, logo |
| Muted cream | `#B8A88A` | Body, hours, secondary |
| Caramel | `#C8852A` | **ONE per piece** — QR frame, rule, or wordmark |
| Separator | `#F5ECD7` at **8% opacity** | Hairline rules |

### CMYK (document color mode — use these in type)

| Swatch | C | M | Y | K |
|--------|---|---|---|---|
| Void | 0 | 3 | 8 | 96 |
| Board black | 0 | 4 | 6 | 90 |
| Cream | 2 | 6 | 16 | 0 |
| Muted cream | 2 | 10 | 25 | 30 |
| Caramel | 0 | 37 | 80 | 22 |

### Print blacks (tell vendor)

| Use | Spec |
|-----|------|
| Large dark areas | Rich black: C60 M40 Y40 K100 |
| Type & fine detail | Standard black: K100 only |

### Caramel rule (doctrine)

**One caramel element per piece. No exceptions.**  
Pick exactly one: QR frame (default) · horizontal rule · wordmark accent (only if no QR).

---

## 3. Background system (master stone + optional warm light)

**Identity = stone.** Warm glow = lighting tool, not brand element. Use selectively.

### Default stack (every file)

| Layer | File | Notes |
|-------|------|-------|
| **Master stone** | `references/menu-background-master-stone.jpg` | No glow. Dark, quiet, neutral. `#14120F` family. |
| **Warm light overlay** (optional) | `references/warm-light-overlay.png` | Separate layer. **Off by default.** |
| **Void overlay** (rare) | Fill `#0E0C0A` Multiply 50% | Only if type doesn't read |

Square crops: `menu-background-master-stone-square.jpg` + `warm-light-overlay-square.png`

**Previews:** `mockups/menu-background-master-stone-preview.jpg` · `mockups/menu-background-master-with-glow-preview.jpg` · `mockups/14_warm_light_reference.png`

All masters: **5100 × 9000 px @ 300 DPI** (17″ × 30″). Crop to fit each canvas.

### When to turn warm light ON

| Piece | Overlay opacity |
|-------|-----------------|
| SkyView lobby stand | 40–60% |
| Watermarc front | 30–50% |
| Sunday exit | 20–40% |
| Counter card, salon, office | **Off** |
| Menu middle board | **Off** |

Blend mode: **Soft Light** or **Screen** at 5–15% effective warmth. If it reads as "Hideout uses orange glow" → reduce or remove.

### How to place background (every file)

1. New doc → fill base **Void `#0E0C0A`**
2. Place `menu-background-master-stone.jpg` → Linked Smart Object → cover canvas
3. *(Optional)* Place `warm-light-overlay.png` above stone → Soft Light, opacity per table
4. Lock `BASE` + `TEXTURE` groups

### Alternate stones (compare only)

| File | Use |
|------|-----|
| `menu-background-family-grid.jpg` | Same as master stone (alias) |
| `menu-background-v4-quiet-slate.jpg` | Softer if master too busy on small cards |
| `menu-background-v4-cardstock.jpg` | 3.5×2 counter if needed |

**Rule:** Cream type must read at 3 feet without glow. Glow is composition, not rescue.

---

## 4. QR codes (generate before building)

Save SVGs to `qr-codes/`. Square modules, dark on white, error correction **M**.

| File | URL | Used on |
|------|-----|---------|
| `qr-nfc.svg` | `https://hideoutmiami.com/app?source=nfc` | Counter, mini flyer default |
| `qr-skyview.svg` | `https://hideoutmiami.com/app?source=skyview` | Lobby stand |
| `qr-watermarc.svg` | `https://hideoutmiami.com/app?source=watermarc` | Watermarc card, flyer variant |
| `qr-neighbor.svg` | `https://hideoutmiami.com/app?source=neighbor` | Salon, house card |
| `qr-weekday.svg` | `https://hideoutmiami.com/app?source=weekday` | **Sunday exit** |
| `qr-village.svg` | `https://hideoutmiami.com/app?source=village` | In-room Sunday only (not print exit card) |
| `qr-office.svg` | `https://hideoutmiami.com/app?source=office` | Office B2B card |

**QR styling on card:**
- White island behind modules (`#FFFFFF`)
- Modules: Board black `#1C1A18`
- Caramel frame: 3–4 pt stroke `#C8852A`, 4 pt corner radius
- Min physical size: **1″ × 1″** (1.25–1.5″ on 4×6)
- Micro-label below: DM Mono 7–8 pt, Muted cream 70%

---

## 5. Global document settings (every new file)

```
Color mode:     CMYK
Resolution:     300 DPI
Bit depth:      8-bit
Color profile:  U.S. Web Coated (SWOP) v2
Bleed:          0.125″ all sides
```

### Guides (set once, copy to each file)

| Guide | Position from canvas edge |
|-------|---------------------------|
| Bleed outer | 0″ (canvas edge) |
| Trim | 0.125″ inset |
| Safe zone | 0.25″ inset (0.125″ inside trim) |

---

## 6. Typography hierarchy (structural — every piece)

Three levels only. If a line doesn't fit a level, cut it.

| Level | Role | Font | Color | Rule |
|-------|------|------|-------|------|
| **L1** | The one thing | Cormorant Garamond *Italic* | Cream `#F5ECD7` | One statement. 3–8 words. Dominates the card. |
| **L2** | Supporting fact | DM Sans *Medium* ALL CAPS | Muted cream `#B8A88A` | +80 tracking. Category eyebrows. One line max. |
| **L3** | Body / utility | DM Sans Regular or DM Mono | Muted cream / Cream | Hours, prices, URLs. Smallest. Never competes with L1. |

**Editing rule:** Strongest pieces say one thing (observations, not advertising). If a piece explains → cut words until it's one observation.

| Strong (ship) | Weak (edit down) |
|---------------|------------------|
| Same building. | Multi-line pitch |
| Two minutes away. | Feature lists |
| Your usual — two taps. | Price grids on editorial cards |
| Welcome to the neighborhood. | Second URL when QR exists |

### Character styles (save in `psd-templates/hideout-character-styles-base.psd`)

| Style | Level | Font | Size | Color | Tracking | Leading |
|-------|-------|------|------|-------|----------|---------|
| L1 — Display XL | L1 | Cormorant Italic | 52 pt | Cream | 0 | 62 pt |
| L1 — Display L | L1 | Cormorant Italic | 44 pt | Cream | 0 | 52 pt |
| L1 — Display M | L1 | Cormorant Italic | 38 pt | Cream | 0 | 46 pt |
| L1 — Display S | L1 | Cormorant Italic | 28 pt | Cream | 0 | 34 pt |
| L1 — Display XS | L1 | Cormorant Italic | 26 pt | Cream | 0 | 32 pt |
| L2 — Label | L2 | DM Sans Medium | 8–9 pt | Muted cream | +80 | 14 pt |
| L3 — Body L | L3 | DM Sans Regular | 15 pt | Muted cream | 0 | 22 pt |
| L3 — Body M | L3 | DM Sans Regular | 13 pt | Muted cream | 0 | 20 pt |
| L3 — Body S | L3 | DM Sans Regular | 11 pt | Muted cream | 0 | 17 pt |
| L3 — Utility M | L3 | DM Mono Regular | 11 pt | Cream | 0 | 16 pt |
| L3 — Utility S | L3 | DM Mono Regular | 9 pt | Muted cream | 0 | 14 pt |
| L3 — Utility XS | L3 | DM Mono Regular | 7–8 pt | Muted cream 70% | 0 | 12 pt |
| Logo | — | Cormorant Regular | varies | Cream | 0 | — |

**Menu board middle panel:** L2 for FOOD / DRINKS headers · L3 for items + prices · two columns only here.

**Menu price alignment:** Right tab stop at right safe-zone edge. Item left, price right.

---

## 7. Layer structure (identical in every PSD)

Top → bottom:

```
GUIDES          Trim (red) + Safe (blue) — locked
COPY            L1 / L2 / L3 type only
ACCENT          ONE caramel layer only
QR              Linked Smart Object + micro-label
LOGO            Linked wordmark Smart Object
TEXTURE         Master stone JPG (Linked Smart Object)
WARM LIGHT      warm-light-overlay.png — optional, Soft Light, often OFF
VOID            #0E0C0A Multiply 50% — rare
BASE            #0E0C0A fill
```

---

## 8. Creation order (which files to build, in sequence)

Build in this order — each step feeds the next:

| Step | Piece | Why this order |
|------|-------|----------------|
| **1** | Mini flyer base (`4×9`, front + back) | Highest leverage; sets menu type system |
| **2** | SkyView lobby stand `5×7` | Week 1 deploy; tests Display XL |
| **3** | Counter card `3.5×2` | Week 1 deploy; tests small format |
| **4** | Mini flyer variants (4 more) | Duplicate base; swap QR + 2 lines only |
| **5** | Watermarc card `4×6` 2-sided | Neighborhood intro |
| **6** | Sunday exit `4×6` | Uses `qr-weekday.svg` |
| **7** | Salon tent `3×4` | Smallest placement |
| **8** | Office B2B `4×6` | Pricing layout |
| **9** | House card `4×6` 2-sided | Universal fallback |
| **10** | Column menu middle board | Two-column Food \| Drinks — in-venue |

**Estimated time:** Base flyer 2–3 hrs · each card 30–45 min · variants 5 min each after base.

---

## 9. Per-piece specifications

Bleed = 0.125″ per side. **Canvas = trim + 0.25″** each dimension.  
Pixels = canvas inches × 300.

---

### Piece 0 — Mini menu flyer

| | Front | Back |
|---|------|------|
| **Trim** | 4″ × 9″ | 4″ × 9″ |
| **Canvas** | 4.25″ × 9.25″ | 4.25″ × 9.25″ |
| **Pixels** | 1275 × 2775 | 1275 × 2775 |
| **PSD name** | `hideout-mini-flyer-4x9-FRONT-v1.psd` | `hideout-mini-flyer-4x9-BACK-v1.psd` |
| **Sides** | Menu identity | One action |
| **Caramel** | Short rule above hours (front) | QR frame (back) |
| **QR** | None on front | `qr-nfc.svg` (swap per variant) |
| **Qty** | 200–500 | |

**Front copy:** Full menu per `design-decisions/02_MINI_FLYER.md` — categories SIGNATURES, TOASTS, COFFEE & DRINKS, SIDES. One-line items + price. Hours footer:

```
Wed–Fri 8–5
Sat–Sun 10–5
2nd floor · SkyView 22
```

**Back copy (edited):**

```
Order ahead.          ← L1 only
[QR 1.5″ caramel frame]
```

No URL. No second CTA. QR is the action.

**Flyer variants (swap QR + one L3 line max):**

| Variant | QR file | L3 line |
|---------|---------|---------|
| Standard / bag | `qr-nfc.svg` | — |
| Watermarc | `qr-watermarc.svg` | 2-minute walk. |
| Salon | `qr-neighbor.svg` | Terrace pickup. |
| Sunday takeaway | `qr-weekday.svg` | Sunday 11–2. |
| Office | `qr-office.svg` | Weekly orders welcome. |

**Full edited copy:** `COPY_FINAL.md`

---

### Piece 1 — Counter NFC / QR card

| Spec | Business card (default) | Tent card (alt) |
|------|-------------------------|-----------------|
| **Trim** | 3.5″ × 2″ | 4″ × 6″ |
| **Canvas** | 3.75″ × 2.25″ | 4.25″ × 6.25″ |
| **Pixels** | 1125 × 675 | 1275 × 1875 |
| **PSD** | `hideout-counter-card-3x2-v1.psd` | `hideout-counter-tent-4x6-v1.psd` |
| **Background** | `v4-cardstock` or `v4-quiet-slate` | |
| **Caramel** | QR frame | QR frame |
| **QR** | `qr-nfc.svg` · 1″ min | 1.25″ |
| **Qty** | 100 | |

**Copy (register — edited):**

```
hideout                                    [QR]
Your usual —
two taps.
```

No hours. No scan label. QR is enough.

**Alt L1 (entrance):** `Order before you walk over.`

---

### Piece 2 — SkyView lobby stand

| Spec | Value |
|------|-------|
| **Trim** | 5″ × 7″ |
| **Canvas** | 5.25″ × 7.25″ |
| **Pixels** | 1575 × 2175 |
| **PSD** | `hideout-lobby-stand-5x7-v1.psd` |
| **Background** | `v4-shale` or `v4-warm-stone` |
| **Caramel** | QR frame |
| **QR** | `qr-skyview.svg` · 1.5″ |
| **Qty** | 25 |

**Copy (edited):**

```
hideout

Same
building.

Terrace · 2 minutes.

[QR]
```

Cut: product list, second CTA, hours, floor line. L1 + one L3 + QR.

**No "SkyView" on card.** Display XL (52 pt) for "Same building."

---

### Piece 3 — Watermarc card (2-sided)

| | Front | Back |
|---|------|------|
| **Trim** | 4″ × 6″ | 4″ × 6″ |
| **Canvas** | 4.25″ × 6.25″ | 4.25″ × 6.25″ |
| **Pixels** | 1275 × 1875 | 1275 × 1875 |
| **PSD** | `hideout-watermarc-4x6-FRONT-v1.psd` | `hideout-watermarc-4x6-BACK-v1.psd` |
| **Caramel** | Short rule ~40% width | QR frame |
| **QR** | None | `qr-watermarc.svg` · 1.5″ |
| **Qty** | 50 |

**Front copy (edited):**

```
Welcome to the neighborhood.    ← L1

────────  (caramel rule)

Open-air terrace.
Coffee. Real food.
Two minutes.

2nd floor · SkyView 22          ← L3 mono
```

**Back copy (edited):**

```
Order before
you walk over.                  ← L1

[QR]
```

No logo, hours, B2B teaser, or URL on back.

---

### Piece 4 — Salon tent card

| Spec | Value |
|------|-------|
| **Trim** | 3″ × 4″ |
| **Canvas** | 3.25″ × 4.25″ |
| **Pixels** | 975 × 1275 |
| **PSD** | `hideout-salon-card-3x4-v1.psd` |
| **Background** | `v4-cardstock` or `v4-quiet-slate` |
| **Caramel** | QR frame |
| **QR** | `qr-neighbor.svg` · 1.1″ |
| **Qty** | 25 |

**Copy (edited):**

```
Two minutes
away.                           ← L1

[QR]
```

No body. No micro line. 3-second read at checkout.

---

### Piece 5 — Sunday exit bridge

| Spec | Value |
|------|-------|
| **Trim** | 4″ × 6″ |
| **Canvas** | 4.25″ × 6.25″ |
| **Pixels** | 1275 × 1875 |
| **PSD** | `hideout-sunday-exit-4x6-v1.psd` |
| **Background** | `v4-quiet-slate` or `v4-shale` |
| **Caramel** | Short rule (~25% width) after headline |
| **QR** | `qr-weekday.svg` · 1.25″ — **NOT village** |
| **Qty** | 50–100/month |

**Copy (edited):**

```
[empty top third — intentional]

Same house.
Different room.               ← L1

────────  (caramel rule, short)

[QR]

hideout                         ← logo, small
```

No body paragraph. No hours. Handoff line is spoken, not printed.

**Handed in person at exit.** Not left on tables.

---

### Piece 6 — Office / B2B card

| Spec | Value |
|------|-------|
| **Trim** | 4″ × 6″ |
| **Canvas** | 4.25″ × 6.25″ |
| **Pixels** | 1275 × 1875 |
| **PSD** | `hideout-office-card-4x6-v1.psd` |
| **Caramel** | QR frame |
| **QR** | `qr-office.svg` · 1.25″ |
| **Qty** | 25 |

**Copy (edited — functional piece, prices stay):**

```
hideout

Office breakfast.               ← L1

GALLON COLD BREW                ← L2

$16/person                      ← L3 mono
$45/gallon
48hr lead

[QR]

Weekly orders welcome.

_________________  (blank — handwrite number)
```

**Prices in DM Mono** — not Cormorant. No URL.

---

### Piece 7 — House card (universal)

| | Front | Back |
|---|------|------|
| **Trim** | 4″ × 6″ | 4″ × 6″ |
| **Canvas** | 4.25″ × 6.25″ | 4.25″ × 6.25″ |
| **Pixels** | 1275 × 1875 | 1275 × 1875 |
| **PSD** | `hideout-house-card-4x6-FRONT-v1.psd` | `hideout-house-card-4x6-BACK-v1.psd` |
| **Caramel** | QR frame | — |
| **QR** | `qr-neighbor.svg` or `qr-nfc.svg` · 1.5″ | None |
| **Qty** | 100–200 |

**Front (edited):**

```
hideout

Open-air terrace.
Coffee. Real food.

[QR]
```

**Back (edited):**

```
Wed–Fri 8–5
Sat–Sun 10–5
2nd floor · SkyView 22
```

---

### In-venue — Column menu stack

| Board | Layout | Rule |
|-------|--------|------|
| **Top** — FIRST TIME? | Single column editorial | Do not change |
| **Middle** — MENU | **Two column** Food \| Drinks | Navigation only — divider required |
| **Bottom** — MADE WITH REAL THINGS | Single column editorial | Do not change |

| Spec | Value |
|------|-------|
| **Background** | `menu-background-family-grid.jpg` or `v4-warm-stone` |
| **Layout doctrine** | `design-decisions/06_LAYOUT_DOCTRINE.md` |
| **Board spec** | `04_MENU_BOARD_SYSTEM.md` |

Darken background per `references/menu_background_treatment.md` if using v1 stone.

---

## 10. Build sequence inside each file (10 steps)

1. **New doc** — dimensions from Section 9, CMYK 300 DPI
2. **BASE** — fill Void `#0E0C0A`
3. **TEXTURE** — place background, cover canvas, lock
4. **Headline** — Cormorant Italic first; size it; let it breathe
5. **Negative space check** — if crowded, remove an element
6. **ACCENT** — one caramel element only
7. **QR** — linked SVG + frame + micro-label
8. **Supporting copy** — DM Sans body
9. **Utility** — DM Mono hours/URLs
10. **LOGO** — last, smallest · **Remove one thing** before export

---

## 11. Export

### Print vendor (send this)

```
Format:         PDF/X-1a
Color:          CMYK
Resolution:     300 DPI
Bleed:          0.125″ included
Marks:          Trim marks only
Compression:    None or ZIP
```

**Naming:** `hideout-[piece]-[size]-PRINT.pdf` → save to `exports/`

### Proof / screen

```
Format:   JPEG sRGB
Quality:  10
DPI:      150
```

**Naming:** `hideout-[piece]-[size]-PROOF.jpg`

### Vendor note (paste in print order)

```
Dark background pieces — rich black for large areas: C60 M40 Y40 K100
Type and fine detail: K100 only
Finish: Soft-touch matte laminate (or matte coated, not gloss)
QR codes: confirm scan-ability before final run
Bleed: 0.125″ per document. Trim marks on PDF.
```

---

## 12. Pre-flight (before paying printer)

- [ ] Every QR scans from 12″ on iPhone
- [ ] Sunday exit uses `qr-weekday.svg` — not village
- [ ] One caramel element per piece — verified at 100% zoom
- [ ] Safe zone: no type or QR inside 0.25″ from trim
- [ ] CMYK mode confirmed (not RGB)
- [ ] Cream type readable at arm's length on proof print
- [ ] File names match convention
- [ ] PDF/X-1a exported to `exports/`

---

## 13. Week 1 print run (unilateral)

| Priority | Piece | Qty |
|----------|-------|-----|
| 1 | Lobby stand 5×7 | 25 |
| 2 | Counter card 3.5×2 | 100 |
| 3 | Mini flyer (standard nfc) | 200–500 |

No conversations required. Deploy and observe.

---

## 14. Reference docs (do not open on build day unless stuck)

| Doc | When |
|-----|------|
| `design-decisions/00_MASTER_ART_DIRECTION.md` | Visual filter |
| `design-decisions/02_MINI_FLYER.md` | Full menu item list |
| `design-decisions/04_AI_PROMPTS.md` | Optional photography layers |
| `placements/` | Per-piece drill-down |
| `04_MENU_BOARD_SYSTEM.md` | Column board layout |

**This file is the only doc you need open in Photoshop.**

---

## 15. Ready to execute — final status

### Locked decisions ✓

| Decision | Status |
|----------|--------|
| Editorial cards = single column | `06_LAYOUT_DOCTRINE.md` |
| Menu middle board = two column Food \| Drinks | `04_MENU_BOARD_SYSTEM.md` |
| Column top + bottom boards unchanged | Locked |
| Master stone, glow as separate overlay | `menu-background-master-stone.jpg` + `warm-light-overlay.png` |
| Typography L1 / L2 / L3 | Section 6 above |
| One caramel per piece | Section 2 |
| Sunday exit QR = `weekday` | Section 4 |
| Default background = family grid stone | Section 3 |

### Assets on disk ✓

| Asset | Path |
|-------|------|
| Execution manual | `PHOTOSHOP_EXECUTION_MANUAL.md` (this file) |
| Master stone | `references/menu-background-master-stone.jpg` |
| Warm overlay | `references/warm-light-overlay.png` |
| Family mockup | `mockups/13_physical_print_family_june_2026.png` |
| Per-piece mockups | `mockups/01–12_*.png` |
| Copy + dimensions | Section 9 of this file |
| QR list | Section 4 — **you generate SVGs** → `qr-codes/` |

### You still do before print ✓

1. Install fonts (Section 1)
2. Generate 7 QR SVGs (Section 4)
3. Run `psd-templates/scripts/build-all-templates.jsx` (creates all PSDs + character-styles base)
4. Execute creation order (Section 8): flyer → lobby → counter → variants → rest
5. Scan every QR from 12″ (Section 12)
6. Export PDF/X-1a to `exports/`

### Remaining work is editing, not style

Cut words. One observation per editorial card. Office card keeps prices (functional piece). Top/bottom menu boards remind people they can eat and drink here.

**You are ready to open Photoshop.**

---

*Hideout Miami · Print Execution Manual · June 2026*
