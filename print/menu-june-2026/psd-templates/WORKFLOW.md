# Photoshop Workflow (honest)

## Don't give up. Stop auto-layout.

The **mockups** are the design. Scripts can't match your eye or Adobe Fonts reliably.

## Use REF files (best path for you)

**Open:** `*-REF.psd`

Each file has:
- Correct 300 DPI dimensions + bleed guides
- Master stone background
- **Mockup at 40% opacity** — trace layout, scale, QR position
- Empty `COPY_YOUR_TYPE_HERE` group
- Empty `QR_PLACEHOLDER` group

### 15-minute editorial master

1. Open `hideout-lobby-stand-5x7-v1-REF.psd`
2. Type live: Cormorant + DM Sans from `COPY_FINAL.md`
3. Match the mockup reference layer (size "Same building." like the mockup — big)
4. Drop QR SVG, caramel frame
5. Delete `MOCKUP_REFERENCE` group
6. Save As `LOBBY_MASTER.psd`
7. Duplicate → Sunday, Salon, Watermarc (swap headline + QR only)

### Three templates, not ten

| Template | Dupes to |
|----------|----------|
| LOBBY_MASTER | Sunday exit, Salon, Watermarc back |
| Counter REF | (done) |
| Office REF | (functional — keep prices) |
| House REF | universal fallback |

Flyer front = Illustrator. Menu board = Illustrator.

## Ignore these

| File | Why |
|------|-----|
| `*.psd` (no suffix) | Rasterized — trash |
| `*-LIVE.psd` | Wrong fonts (Myriad), wrong layout |

## Regenerate REF files

File → Scripts → Browse → `scripts/build-mockup-reference-templates.jsx`

## Copy source

`../COPY_FINAL.md` — edited text (may differ slightly from mockup visuals; your call which wins)
