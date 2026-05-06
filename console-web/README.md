# Hideout Operator Console — web + Supabase

Deployable twin of `hideout_console_v16.html` with **browser UI unchanged**. Data syncs through Supabase (no `localStorage`).

## Layout

```
console-web/
  index.html                      # Generated from hideout_console_v16.html (+ auth gate); do not edit by hand — run npm run dev/build
  src/
    main.js                       # Supabase Auth (magic link) + boot ordering
    persist.js                    # Debounced reads/writes to daily_logs, weekly_reviews, monthly_reviews, app_state
    console-app.js                # Generated from v16 `<script>` (see scripts/extract-from-html.mjs)
  scripts/
    extract-from-html.mjs         # Copies & patches v16 → index.html + src/console-app.js
  supabase/migrations/
    001_hideout_console_tables.sql
  .env.example
  vercel.json
  package.json
  vite.config.js
```

Source of truth for markup + original logic: `../hideout_console_v16.html` (repo root).

## Supabase setup

1. Create a project (or use an existing one).
2. Run `supabase/migrations/001_hideout_console_tables.sql` in the SQL editor.
3. **Auth → disable public sign-ups** (or only invite operators you trust). Create users from the Auth dashboard or send magic links only to allow-listed emails.
4. **Auth → URL configuration**: add your Vercel domain and `http://localhost:5173` under Redirect URLs.
5. Copy **Project URL** and **anon public** key into `.env` (see `.env.example`).

## Local run

```bash
cd console-web
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open the printed URL → sign in with magic link → use the console as before.

Build:

```bash
npm run build
npm run preview   # optional: test dist locally
```

## Vercel

1. New project → Import this repo → **Root Directory** = `console-web`.
2. Framework: Other (already set via `vercel.json` outputs `dist`).
3. Build: `npm run build` Output: `dist`.
4. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Redeploy after env changes.

## Square read-only sync (Phase 1)

Add these Vercel project env vars (Production):

- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT=production`
- `ANTHROPIC_API_KEY` (for Brice invoice scan autofill)

Server route:

- `GET /api/square/daily-summary?date=YYYY-MM-DD`

Behavior:

- Read-only Square pull (no writes to Square)
- Returns daily `grossSales`, `orderCount`, `averageTicket`, `topItems`, `salesByHour`
- Includes `paymentMethodBreakdown` and `channelBreakdown` when available

Today flow:

- Click **Sync Square** on Today
- Console prefills `Rev $`, `Orders`, `Top item`, and keeps manual confirmation
- User still presses **Log**; no auto-submit

Error states surfaced in UI:

- missing token (`TOKEN_MISSING`)
- missing location (`LOCATION_MISSING`)
- Square API failure (`SQUARE_API_ERROR`)
- no sales found (`NO_SALES`)

Next phase (not in this release):

- Pull read-only Square customer/loyalty metrics (if API/scopes support it) to prefill
  `SMS Captures` and `Loyalty Signups`.
- Until then, those fields remain manual by design.
- Once customer/loyalty scopes are confirmed in Square, remove manual loyalty entry from
  the Today log flow and source those values from Square.

## Export / Import

- **Export**Still builds the same `.json` shape with `logs`, `checks`, `djs`, `anchors`, `notes`, `sunday`, `reviews`, `monthlies`, `decisions` (weekly/monthly blobs match v16; **`monthlies` added** vs older exports — harmless for backwards compatibility).
- **Import** merges into memory and pushes a **full rewrite** of all rows for the signed-in user (see `persistImportMerge`).

## Persistence Audit (editable controls)

- **Persisted (Supabase)**
  - **Today**: daily log entries (`logs`), week checklist toggles (`checks`), Sunday status/handle (`sunday`), today lever.
  - **COGS Check**: reduction checkboxes (`checks`), COGS calculator inputs (`ui.cogsCalculator`), coffee yield calculator inputs (`ui.coffeeYield`).
  - **This Week**: same `checks` source.
  - **DJ Roster**: full roster CRUD (`djs`).
  - **Anchor Network**: full node CRUD (`anchors`).
  - **Inventory**: item “have” quantities (`ui.inventoryHave`), weekly spend calculator inputs (`ui.inventorySpend`).
  - **Open/Close**: checklist toggles (`checks`), saved notes (`notes`).
  - **Weekly Review**: saved review records (`reviews`).
  - **Monthly lock section**: saved monthly records (`monthlies`).
  - **Decisions**: experiments CRUD + outcomes (`decisions`).

- **Intentionally temporary (non-persisted)**
  - **P&L break-even mini calculator** (`be-*` fields) — scratch only.
  - View-only/authored pages with no mutable user state: **Cost Cards**, **Scripts**, **Roadmap**, **Menu**.

## Verification checklist

1. Sign in → add a revenue log → **hard refresh**: log still visible.
2. Open DevTools → Application → **localStorage is empty** for prior `h-*` keys (no reliance on them).
3. Hit **Export** → save JSON → sign out → sign in as same user → **Import** file → refresh → data restored.
4. From a **second device or browser profile**, sign in as the same user → same logs/reviews/cadence state after load.
5. Toggle a **week check** → refresh → toggle still correct (proves `app_state` round-trip).

## Changing the HTML console

Edit `hideout_console_v16.html`. Re-run `node scripts/extract-from-html.mjs` (happens automatically on `npm run dev` / `npm run build` via `prebuild` / dev script).
