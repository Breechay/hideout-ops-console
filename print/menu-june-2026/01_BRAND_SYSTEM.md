# Hideout Print — Brand System

Non-negotiable tokens for all physical pieces. Matches Hideout iOS app.

---

## Colors

| Token | Hex | Use |
|-------|-----|-----|
| Void black | `#0E0C0A` | Full-bleed backgrounds |
| Board black | `#1C1A18` | Cards, panels (app `hideoutVoid`) |
| Surface charcoal | `#242220` | Secondary panels |
| Cream | `#F5ECD7` | Headlines, body |
| Muted cream | `#B8A88A` | Hours, metadata, fine print |
| Caramel | `#C8852A` | **ONE accent per piece** — QR frame or rule only |
| Separator | `#F5ECD7` @ 10% | Hairline rules |

**CMYK caramel (print):** C:0 M:37 Y:80 K:22

---

## Typography

| Role | Font | Use |
|------|------|-----|
| Display | Cormorant Garamond *Italic* | `hideout` wordmark, headlines, feature names |
| Body | DM Sans Regular / Medium | Descriptions, hours, labels |
| Utility | DM Mono Regular | Prices only (`$11`, `$45/gal`) |

**Fallbacks (if fonts unavailable):**
- Display → Playfair Display Italic
- Body → Inter or Helvetica Neue Light
- Mono → IBM Plex Mono or Courier New

**Never:** Display font for body copy or instructions.

---

## Spacing

| Token | px |
|-------|-----|
| Micro | 4 |
| Small | 8 |
| Medium | 16 |
| Large | 24 |
| XL | 40 |

---

## Texture

Asset: `menu-background.jpg` (this folder)

1. Place at 100% as background layer
2. Overlay void black `#0E0C0A` at 40–60% multiply
3. All type above — never on white

---

## QR code rules

- Frame: caramel `#C8852A` (primary accent on most pieces)
- QR island: white or `#1C1A18` — must scan cleanly
- Minimum size: **1" × 1"**
- Quiet zone: 4 modules minimum
- Test: iPhone scan from **12"** before print run
- Generate: square modules, dark on white SVG → frame in caramel

---

## Logo

Wordmark: **hideout** (lowercase) in display italic. Optional icon mark from column boards. No mascot. No emoji.

---

## Anti-patterns (visual)

- Multiple caramel elements on one piece
- Bright red / sale badges
- Stock latte art hero images
- Glossy / high-saturation finish
- Different layout grid per placement
- App Store badge larger than QR
