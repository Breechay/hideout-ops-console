# PSD Templates

## Use the LIVE files (editable type)

**Open these:** `*-LIVE.psd` — generated with live text layers, guides, proper scale.

| File | Piece |
|------|-------|
| `hideout-lobby-stand-5x7-v1-LIVE.psd` | **Start here** — master editorial layout |
| `hideout-counter-card-3x2-v1-LIVE.psd` | Counter |
| `hideout-watermarc-4x6-FRONT-v1-LIVE.psd` | Watermarc front |
| `hideout-watermarc-4x6-BACK-v1-LIVE.psd` | Watermarc back |
| `hideout-sunday-exit-4x6-v1-LIVE.psd` | Sunday exit |
| `hideout-salon-card-3x4-v1-LIVE.psd` | Salon |
| `hideout-office-card-4x6-v1-LIVE.psd` | Office B2B |
| `hideout-house-card-4x6-FRONT-v1-LIVE.psd` | House front |
| `hideout-house-card-4x6-BACK-v1-LIVE.psd` | House back |
| `hideout-mini-flyer-4x9-BACK-v1-LIVE.psd` | Flyer back |

**Lobby headline:** 86pt Cormorant Italic — poster scale, not corner body copy.

---

## Ignore the old files (raster)

`hideout-*-v1.psd` **without LIVE** = flattened starter comps. Text not editable. Archive or delete.

---

## Fast workflow (your skill level)

1. Open `hideout-lobby-stand-5x7-v1-LIVE.psd`
2. Tweak if needed → **Save As** `LOBBY_MASTER.psd`
3. **Duplicate** for editorial family (Sunday, Salon, Watermarc) — swap L1 + QR only
4. Counter / office / house = separate utility structure (already built LIVE)
5. Flyer front = Illustrator · flyer back = LIVE PSD
6. Copy from `../COPY_FINAL.md` · QR from `../qr-codes/`

### Regenerate LIVE files

Photoshop → **File → Scripts → Browse** → `scripts/build-all-live-v2.jsx`

(~45 seconds, all 9 files)

---

## Layer groups (LIVE files)

```
BASE / TEXTURE (stone placed) / WARM_LIGHT / LOGO / COPY / ACCENT / QR / NOTES
```

Text in **COPY** group = live · editable · Cormorant / DM Sans

---

## Illustrator

Menu board middle + mini flyer **front** only.
