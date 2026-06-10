# Photoshop / Affinity Build Guide

Open Photoshop to **assemble**, not decide. All decisions are in `00`–`03` and `placements/`.

---

## Layer structure (every piece)

```
[ Piece Name — e.g. SkyView Lobby Stand 5x7 ]

Group: SAFETY & BLEED
  └── bleed guides (0.125" outside trim)
  └── safe zone guides (0.125" inside trim)

Group: FOREGROUND
  └── copy text layers
  └── QR code (Smart Object, linked from qr-codes/)
  └── logo (Smart Object, linked)

Group: ACCENT
  └── caramel rule or QR frame (#C8852A) — ONE only

Group: TEXTURE
  └── menu-background.jpg @ 100%
  └── Void #0E0C0A fill, Multiply 50–60%

Group: BASE
  └── background fill #0E0C0A
```

Optional: AI photo layer between TEXTURE and BASE, with extra multiply.

---

## File naming

```
hideout-[piece]-[format]-v1.psd
hideout-[piece]-[format]-PRINT.pdf

Examples:
hideout-lobby-stand-5x7-v1.psd
hideout-counter-card-3x2-v1.psd
hideout-mini-menu-flyer-4x9-v1.psd
hideout-sunday-exit-4x6-v1.psd
```

Working files → `psd-templates/`  
Print PDFs → `exports/`

---

## QR workflow

1. Generate SVG from `qr-codes/README.md` URLs
2. Place as Smart Object
3. Frame with 2–4pt caramel stroke or rule
4. Test scan before export

---

## Execution sequence

1. Generate AI backgrounds (`prompts/`) — 4 variations each, pick best
2. Create master PSD template with layer groups above
3. Duplicate per placement — swap copy from `placements/`
4. Drop in texture + type (Cormorant + DM Sans + DM Mono)
5. Link QR Smart Objects per URL table
6. Export CMYK PDF 300 DPI with bleed
7. Scan test all QRs
8. Print batch 1: lobby stand + counter (week 1)
9. Deploy lobby → counter → hand-deliver rest

---

## Fonts to install before starting

- Cormorant Garamond (Italic)
- DM Sans (Regular, Medium)
- DM Mono (Regular)

Same families as Hideout iOS app (`Documents/HideoutApp/HideoutApp/Resources/Fonts/`).
