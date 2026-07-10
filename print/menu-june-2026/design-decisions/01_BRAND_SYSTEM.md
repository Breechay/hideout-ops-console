# 01 — Hideout Miami · Print Brand System

---

## Color System

### Hex values (screen design / web)

```
Void           #0E0C0A   — deepest background. Use for card base.
Board black    #1C1A18   — secondary background. Use for inset panels.
Surface        #242220   — tertiary. Rarely used in print.
Cream          #F5ECD7   — primary type. Headlines and body.
Muted cream    #B8A88A   — secondary type. Hours, URLs, fine print.
Caramel        #C8852A   — ONE accent per piece. QR frame, rule, or wordmark only.
Separator      #F5ECD7 at 8–10% opacity — hairline rules.
```

### CMYK conversions (for print)

```
Void           C:0  M:3  Y:8  K:96
Board black    C:0  M:4  Y:6  K:90
Cream          C:2  M:6  Y:16 K:0
Muted cream    C:2  M:10 Y:25 K:30
Caramel        C:0  M:37 Y:80 K:22
```

### Print-specific note
For full-bleed dark pieces, specify "rich black" to the printer:
Rich black = C:60 M:40 Y:40 K:100 — avoids muddy gray on large dark areas.
Do NOT use rich black on type — use the standard Void values above.

### Paper and finish direction
- **Preferred:** 100–130lb matte coated cover stock
- **Premium option:** Soft-touch laminate (adds tactile calm to dark stock)
- **Avoid:** Glossy finish — too promotional, shows fingerprints
- **Avoid:** Uncoated white stock for dark-background pieces — ink won't hold cleanly

---

## Typography System

### Fonts

```
DISPLAY       Cormorant Garamond Italic
              — Use for: primary message on each piece, wordmark
              — Never use for: prices, hours, URLs, more than 12 words at a time
              — The voice of the brand.

BODY          DM Sans Regular / DM Sans Medium
              — Regular: descriptions, body copy, secondary info
              — Medium: category labels (e.g., "COFFEE & DRINKS"), eyebrows
              — The function of the brand.

UTILITY       DM Mono Regular
              — Prices, hours, URLs, codes
              — Nothing else.
```

### Fallbacks (if custom fonts unavailable)

```
Cormorant Garamond Italic → Playfair Display Italic
DM Sans → Inter or Helvetica Neue Light/Regular
DM Mono → IBM Plex Mono or Courier New
```

### Type scale (for print at 300 DPI)

```
Display headline:    36–48pt  Cormorant Garamond Italic, cream
Card subhead:        18–22pt  DM Sans Regular, muted cream
Body:                10–12pt  DM Sans Regular, muted cream
Category labels:     8–9pt    DM Sans Medium, muted cream, +80 tracking, uppercase
Utility (prices):    10–12pt  DM Mono, cream or muted cream
Fine print:          7–8pt    DM Sans Regular, muted cream 70% opacity
```

### Spacing rules

```
Between headline and subhead:     16pt
Between body lines (leading):     1.5× size (14pt text = 21pt leading)
Category label to first item:     12pt
Between items in a category:      8pt
Between categories:               20–24pt
Card internal margin:             18–20pt all sides (generous — negative space is design)
```

### Tracking (letter-spacing) rules

```
Category labels (uppercase):      +80–100 tracking
Display headlines:                0 tracking (let the italic do the work)
Body copy:                        0 or +5 (readability)
Prices:                           0 (monospace already handles rhythm)
```

---

## Grid System

### All pieces share this underlying logic

```
Margin: 12–18% of shortest dimension
Column: single column, left-aligned content
Accent bar: caramel rule or QR frame — always near bottom third or right edge
Logo: top center or top left, small (not hero)
Primary message: upper-middle — biggest element on the card
Secondary info: below the rule, smallest type
QR: lower portion, with room for "scan to order" micro-label
```

### Proportions that work

The column boards use a ~60/40 split — 60% menu items, 40% breathing room.
Cards should aspire to even more negative space. If the card feels "full," remove one element.

---

## QR Code System

### Generation
- Service: qr-code-generator.com, qrmonkey.com, or Adobe Express
- Module style: Square (not rounded — easier to scan, more authoritative)
- Error correction: M level minimum (15%)
- Export format: SVG (infinite resolution for print)

### Styling
```
Modules:        #1C1A18 (Board black) — not pure black, matches board tone
Background:     White island (#FFFFFF) behind QR, then caramel frame around that
Frame:          #C8852A, 3–4pt stroke, 4pt corner radius or square corners
Minimum size:   1" × 1" on any physical piece
Quiet zone:     Minimum 4 modules white space on all sides (outside your frame)
```

### Placement
- Always in lower portion of card — never competing with the primary message
- Include a micro-label below: "scan to order" or "hideoutmiami.com" in DM Mono 7–8pt muted cream
- Test every QR by scanning from 12" away on iPhone camera before sending to print

---

## Logo Usage

### The wordmark
"hideout" in Cormorant Garamond Regular (not italic at small sizes) or use the lockup SVG.
The icon (arch/sunrise mark) can accompany when space allows.

### Size rules
```
On 5×7" lobby stand:      1.2"–1.5" wide
On 4×6" cards:            0.8"–1" wide
On 3.5×2" business card:  0.5"–0.6" wide
```

### Color
Logo always in Cream (#F5ECD7) on dark backgrounds.
Never in caramel — caramel is rationed for the accent element only.

---

## The Caramel Rule (Critical)

**One caramel element per piece. No exceptions.**

This is not an aesthetic preference. It is a doctrine. The caramel color derives its power from scarcity. If it appears in two places on a card, it loses meaning in both places.

Choose ONE of these for each piece:
- The QR frame (recommended default)
- A single horizontal rule
- The wordmark (only if QR frame is not present)
- A price callout (only for the office card)

Once you place caramel somewhere, everything else must be cream or muted cream. No secondary accents. No warm tones trying to be something they're not.

---

## Layer Structure (Photoshop/Affinity)

Every file should use this structure for consistency:

```
[ Group: SAFETY ]
    Safe zone guides (0.125" inside final trim)
    Bleed guides (0.125" outside final trim)

[ Group: COPY ]
    Primary message (Cormorant Garamond Italic)
    Category labels
    Body copy
    Utility text (hours, URL)

[ Group: ACCENT ]
    Caramel element — ONE only

[ Group: QR ]
    QR code Smart Object (linked SVG)
    Micro-label ("scan to order")

[ Group: LOGO ]
    Wordmark Smart Object (linked SVG)

[ Group: TEXTURE ]
    menu-background.jpg — Normal, 100%
    Void black fill — Multiply, 50–60% (deepen it)

[ Group: BASE ]
    Background fill #0E0C0A
```

---

## File Naming Convention

```
hideout-[piece-name]-[dimensions]-v[n].psd       ← working file
hideout-[piece-name]-[dimensions]-PRINT.pdf      ← export (CMYK, 300dpi, 0.125" bleed)
hideout-[piece-name]-[dimensions]-SCREEN.jpg     ← proof/preview

Examples:
hideout-lobby-stand-5x7-v1.psd
hideout-mini-flyer-4x9-v1.psd
hideout-sunday-exit-4x6-v1.psd
hideout-office-card-4x6-v1.psd
hideout-counter-card-3x2-v1.psd
hideout-watermarc-card-4x6-v1.psd
hideout-salon-card-3x4-v1.psd
```

---

## Print Specs Reference

| Piece | Dimensions | Bleed | DPI | Color | Finish |
|---|---|---|---|---|---|
| Mini flyer | 4×9" or 5.5×8.5" | 0.125" | 300 | CMYK | Soft-touch matte |
| Counter card | 3.5×2" or 4×6" | 0.125" | 300 | CMYK | Matte |
| Lobby stand insert | 5×7" | 0.125" | 300 | CMYK | Matte laminated |
| Watermarc card | 4×6" | 0.125" | 300 | CMYK | Soft-touch matte |
| Salon tent | 3×4" | 0.125" | 300 | CMYK | Matte |
| Sunday exit | 4×6" | 0.125" | 300 | CMYK | Matte |
| Office card | 4×6" | 0.125" | 300 | CMYK | Matte |
