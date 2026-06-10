# Hideout Print — Physical Distribution System

Maps print pieces to app deep links and deployment order.

**Canonical copy + agent prompts:** `Documents/HideoutApp/docs/HIDEOUT_PHYSICAL_DISTRIBUTION_AGENT_BRIEF.md`

---

## Eight pieces (+ menu boards)

| # | Piece | File | Priority |
|---|-------|------|----------|
| 0 | Half-sheet flyer | `03_MENU_FLYER_SYSTEM.md` | Core — bag insert |
| 1 | Counter NFC/QR | `placements/01_counter_nfc.md` | Week 1 unilateral |
| 2 | SkyView lobby stand | `placements/02_skyview_lobby.md` | Week 1 unilateral |
| 3 | Watermarc leave-behind | `placements/03_watermarc.md` | Relationship |
| 4 | Salon counter | `placements/04_salon.md` | Relationship |
| 5 | Sunday exit bridge | `placements/05_sunday_exit.md` | Print-and-hand |
| 6 | Office B2B | `placements/06_office_b2b.md` | Relationship |
| 7 | House card (universal) | `placements/07_house_card.md` | Core — anywhere |
| — | Menu column boards | `04_MENU_BOARD_SYSTEM.md` | In-venue |

---

## QR URL master table

| Piece | URL | App opens |
|-------|-----|-----------|
| Mini flyer / counter | `https://hideoutmiami.com/app?source=nfc` | Today + express |
| SkyView lobby | `https://hideoutmiami.com/app?source=skyview` | Today + proximity copy |
| Watermarc | `https://hideoutmiami.com/app?source=watermarc` | Today + proximity copy |
| Salon | `https://hideoutmiami.com/app?source=neighbor` | Today |
| **Sunday exit** | `https://hideoutmiami.com/app?source=weekday` | **Today** — weekday bridge |
| Sunday in-room | `https://hideoutmiami.com/app?source=village` | Sunday tab (during gathering) |
| Office / B2B | `https://hideoutmiami.com/app?source=office` | Catering |

**Sunday exit uses `weekday`, not `village`.** Shipped in HideoutApp `weekdayBridge` launch source.

Save generated SVGs to `qr-codes/` — see `qr-codes/README.md`.

---

## Dependency chain

```
Physical trigger → App open → First order → Repeat → Standing B2B
```

Highest-value validation: **one weekly office account**.

---

## Success metrics (2-week windows)

| Placement | Target | Stop |
|-----------|--------|------|
| SkyView | ≥3 `skyview` opens | Remove stand |
| Counter NFC | Express reorders | Zero scans 30d |
| Sunday exit | Weekday lift from `weekday` | No lift after 4 Sundays |
| Office | 1 trial → weekly cadence | No weekly rhythm |

Log in INCREMENTS Hideout tab + Friday WRC.

---

## Universal Links prerequisite

Upload AASA before relying on NFC/QR → app (not Safari):  
`Documents/HideoutApp/docs/apple-app-site-association` → `hideoutmiami.com/.well-known/`
