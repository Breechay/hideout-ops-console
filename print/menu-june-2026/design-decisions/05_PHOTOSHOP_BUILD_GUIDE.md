# 05 — Hideout Miami · Photoshop Build Guide

> **Superseded for build day.** Use `../PHOTOSHOP_EXECUTION_MANUAL.md` — single operational doc with fonts, colors, pixel sizes, copy, and creation order.

This file retains layer/export reference. Do not open both.

---

## Before you open Photoshop

1. Generate AI images from `04_AI_PROMPTS.md` — have them saved in `print/references/photos/`
2. Export QR codes for all 7 URLs from `print/qr-codes/` — SVG format
3. Have the fonts installed: Cormorant Garamond Italic, DM Sans Regular, DM Sans Medium, DM Mono Regular
4. Have `references/menu-background-v2.jpg` accessible — this is the texture layer (5100×9000, treatment applied)

---

## Setup: Document settings (do this first, every time)

```
Color mode:     CMYK
Resolution:     300 DPI
Bit depth:      8-bit
Canvas size:    Final trim + 0.25" bleed on each side
                (4×6" card = 4.25" × 6.25" canvas)
Color profile:  U.S. Web Coated (SWOP) v2
```

Enable guides:
- Trim line: 0.25" from canvas edge
- Safe zone: 0.375" from canvas edge (0.125" inside trim)
- Center guides: both axes

---

## Layer structure (build this in every file)

```
[ Group: GUIDES ] — locked, visible only
    Trim guide layer (red)
    Safe zone guide layer (blue)

[ Group: COPY ] — your type here
    Headline (Cormorant Garamond Italic)
    Subhead / body (DM Sans Regular)
    Category labels (DM Sans Medium, uppercase)
    Utility text (DM Mono — prices, hours, URLs)

[ Group: ACCENT ] — ONE layer here only
    Caramel element (rule, QR frame, or wordmark)

[ Group: QR ] — Smart Object
    QR code SVG (linked Smart Object — changes update all variants)
    Micro-label ("scan to order")

[ Group: LOGO ] — Smart Object
    Hideout wordmark SVG (linked — changes update all files)

[ Group: TEXTURE ]
    menu-background-v2.jpg — Normal blend mode, 100% opacity (crop from master as needed)
    Void overlay — Color #0E0C0A, Multiply blend mode, 50–60% opacity

[ Group: BASE ]
    Background fill — #0E0C0A, Normal, 100%
```

---

## Building the base (3 minutes per file)

1. Create new document with correct dimensions + bleed
2. Fill base layer: #0E0C0A
3. Place `menu-background-v2.jpg` (or square variant) — fill canvas, Scale as needed, Multiply mode
4. Add void overlay above texture: new layer, fill #0E0C0A, Multiply 50–60%
5. Lock texture and base groups

**Result:** A dark, slightly textured background that matches the column boards.

---

## Typography setup

### Step 1: Install character styles
Create these as Paragraph Styles in Photoshop:

```
Style name: "Display"
  Font: Cormorant Garamond Italic
  Size: [varies by piece — see each card spec]
  Color: #F5ECD7
  Tracking: 0
  Leading: 1.2× size

Style name: "Body"
  Font: DM Sans Regular
  Size: 11pt
  Color: #B8A88A
  Tracking: 0
  Leading: 18pt

Style name: "Label"
  Font: DM Sans Medium
  Size: 8pt
  Color: #B8A88A
  Tracking: +80
  Leading: 14pt
  All caps: Yes

Style name: "Utility"
  Font: DM Mono Regular
  Size: 10pt
  Color: #F5ECD7
  Tracking: 0
  Leading: 16pt
```

### Step 2: Set a price tab stop
For menu-format pieces (mini flyer front):
- Set a right-aligned tab stop at the right safe-zone boundary
- All prices align to this stop
- Item names are left-aligned, prices right-aligned

---

## Building the caramel element

Only one caramel element per piece. Choose which one before you start.

**Option A: QR frame (default for most pieces)**
- Place QR SVG on canvas
- Add a stroke effect: outside, 3px, #C8852A
- Or draw a rectangle around it with no fill, 3px stroke, #C8852A, 4pt corner radius

**Option B: Horizontal rule**
- Draw a rectangle
- Dimensions: varies — see each card spec (usually 30–50% of card width)
- Height: 1px or 2px
- Fill: #C8852A
- No shadow, no glow

**Option C: Wordmark accent** (only when QR is absent)
- Set the "hideout" wordmark or icon in #C8852A
- Everything else stays cream

Once you've placed the caramel element: look at the rest of the card and confirm nothing else is warm. If any other element has warmth, desaturate it or make it pure cream.

---

## QR Code: Smart Object workflow

1. Generate all 7 QR SVGs (see `print/qr-codes/`)
2. Name them: `qr-nfc.svg`, `qr-skyview.svg`, etc.
3. Place each as a Linked Smart Object in Photoshop
4. Add caramel frame as described above
5. Add micro-label below: DM Mono 7pt, `#B8A88A` at 70% opacity

**Why linked Smart Objects:** If you need to regenerate a QR (URL changes), replace the source SVG and all files update.

---

## Building each piece (sequence)

For each card, work in this order:

1. **Base** — background fill + texture (from master)
2. **Primary message** — the Cormorant Garamond Italic headline. Place first. Size it. Let it breathe.
3. **Negative space** — look at the card. Is there enough breathing room around the headline? If not, the card is too full. Remove something.
4. **Caramel element** — place it. Step back. Confirm it's the only warm element.
5. **QR code** — place and frame
6. **Supporting copy** — DM Sans body text, category labels
7. **Utility text** — hours, URL, micro-labels in DM Mono
8. **Logo** — last, smallest, least prominent thing on the card
9. **Remove one thing** — look at the card. What can come off? Remove it.

---

## The "remove one thing" rule

Before exporting, zoom to 100% and look at the card for 10 seconds.

Ask: is there anything on this card that doesn't need to be there?

Common things to remove:
- A second URL when one is enough
- Hours on a card that has a QR (the QR shows hours)
- A tagline that the headline already implies
- A second copy element that says what the first one already said
- Any texture or decorative element added "for interest"

If in doubt, remove it.

---

## Export settings

### For print vendor
```
Format:         PDF/X-1a
Color:          CMYK (confirm in document)
Resolution:     300 DPI minimum
Bleed:          0.125" all sides (include in export)
Marks:          Trim marks only — no registration marks (vendor handles)
Compression:    None or ZIP — no JPEG compression
```

### For proofing / review
```
Format:         JPEG, sRGB
Quality:        10 (high)
Resolution:     150 DPI
Color:          Convert to sRGB for screen
```

### File naming
```
hideout-[piece]-[size]-PRINT.pdf     ← send to vendor
hideout-[piece]-[size]-PROOF.jpg     ← send for review / archive
```

---

## Print vendor instructions (paste this in your order)

```
Dark background pieces — please use rich black for large dark areas:
Rich black = C:60 M:40 Y:40 K:100

Type and fine details should remain in standard black:
Standard black = K:100 only

Preferred finish: Soft-touch matte laminate
If unavailable: Matte coated (not gloss)

QR codes: please confirm scan-ability before final run.

Include 0.125" bleed per document. Trim marks on PDF.
```

---

## Variants workflow (mini flyer)

The mini flyer has 5 variants with only the QR + 1–2 lines of copy changing.

1. Build the base flyer (standard, QR = nfc)
2. Place QR as a Linked Smart Object
3. Save as: `hideout-mini-flyer-4x9-BASE.psd`
4. For each variant:
   - File > Save As → new name (e.g., `hideout-mini-flyer-watermarc-4x9-v1.psd`)
   - Replace QR Smart Object (swap the SVG link)
   - Edit the 1–2 variant copy lines
   - Export PDF

**Time per variant after base is done: ~5 minutes.**

---

## QR Master Table (for generating QR codes)

| File to generate | URL |
|---|---|
| qr-nfc.svg | https://hideoutmiami.com/app?source=nfc |
| qr-skyview.svg | https://hideoutmiami.com/app?source=skyview |
| qr-watermarc.svg | https://hideoutmiami.com/app?source=watermarc |
| qr-neighbor.svg | https://hideoutmiami.com/app?source=neighbor |
| qr-weekday.svg | https://hideoutmiami.com/app?source=weekday |
| qr-village.svg | https://hideoutmiami.com/app?source=village |
| qr-office.svg | https://hideoutmiami.com/app?source=office |

Use: qr-code-generator.com or qrmonkey.com → SVG format → square modules → dark on white → export at highest quality

---

## Sunday exit QR (confirmed)

Sunday exit cards use `qr-weekday.svg` → `?source=weekday` → Today tab (`weekdayBridge` in HideoutApp).

`?source=village` remains for in-room Sunday gathering only (opens Sunday tab).
