import { persistKey, persistImportMerge, getTodayLever, setTodayLever } from './persist.js';

// ── State ──
// REVENUE MODEL (corrected v7):
// Legacy target model:
// Contribution margin = 100% - 30% COGS - 14% staffing = 56%
// To NET $4,000/week: gross * 0.56 - $992 fixed = $4,000
// gross = ($4,000 + $992) / 0.56 = ~$8,914/week
//
// Order paths to $8,914 gross:
//   $16 avg ticket → 90 orders/day (6.2 days)
//   $18 avg ticket → 80 orders/day
//   $20 avg ticket → 72 orders/day
//   $22 avg ticket → 65 orders/day
//   $24 avg ticket → 60 orders/day  ← bundle target
//
// Phase 1 proof point: $5,500 gross → ~$2,100 net (break-even + margin)
// Phase 2 target: $7,100 gross → ~$2,984 net
// Phase 3 target: $8,914 gross → ~$4,000 net
const GROSS_TARGET = 8914;
const PHASE2_TARGET = 7100;
const PHASE1_TARGET = 5500;
const DAILY_TARGET = 1438; // $8,914 / 6.2 operating days
const DAILY_FLOOR_TARGET = 500; // near-term consistency floor
const NET_TARGET = 4000;
const FIXED_COSTS = 992;
const COGS_PCT = 0.30;
const STAFFING_PCT = 0.14;
const S = globalThis.__HIDEOUT_BOOT__.S;
if (!S.ui || typeof S.ui !== 'object') S.ui = {};

function save(k) {
  persistKey(k);
}


// ── Nav ──
function nav(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  const r = { brice: initBrice, today: initToday, week: initWeek, cogs: initCOGS, djs: renderDJs, anchors: renderAnchors, pnl: initPnl, inventory: renderInv, ops: initOps, review: initReview, decisions: initDecisions, scripts: ()=>{}, data: initDataPage, costs: ()=>{} };
  if (r[id]) r[id]();
}

// ── Status + date ──
function initStatus() {
  const now = new Date();
  const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const open = (d >= 3 && d <= 5 && h >= 8 && h < 17) || ((d === 6 || d === 0) && h >= 10 && h < 17);
  document.getElementById('sdot').className = 'sdot' + (open ? '' : ' off');
  document.getElementById('stext').textContent = open ? 'Open now' : 'Closed';
  const tagEl = document.getElementById('today-tag');
  if (tagEl) tagEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── TODAY ──
const weekChecks = [
  { id: 'wc1', text: 'COGS check', note: 'Monday · pull Square data · 15 min · non-negotiable', tag: 'Mon' },
  { id: 'wc2', text: 'Inventory audit + orders', note: 'Tuesday · walk the space · check pars · place orders', tag: 'Tue' },
  { id: 'wc3', text: 'Confirm Sunday DJ', note: 'Friday · one text · done', tag: 'Fri' },
  { id: 'wc4', text: 'Post one IG story', note: 'Friday · patio or food · tag DJ · 30 seconds', tag: 'Fri' },
  { id: 'wc5', text: 'Send SMS to list', note: 'Saturday morning · "Sunday 10–3. [DJ name]. Music + patio. Same as always."', tag: 'Sat' },
  { id: 'wc6', text: 'Sunday slot runs', note: '10am–3pm · every week · no exceptions', tag: 'Sun' },
  { id: 'wc7', text: 'Say "same time next Sunday" to every departing guest', note: 'Sunday · verbally · every single person · not a sign', tag: 'Sun' },
  { id: 'wc8', text: 'Log week total + confirm next DJ', note: 'Sunday · 10 min · what worked?', tag: 'Sun' },
];

function initToday() {
  const di = document.getElementById('l-date');
  if (di && !di.value) {
    di.value = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  }
  renderWeekChecks('week-checks-today');
  renderLogHist('log-hist');
  updateWTD();
  initSundaySlot();
  renderSundayBlock();
  renderWeeklyLever();
  renderWeeklyRisk();
  loadTodayLever();
  updatePaceLine();
  renderCadenceLock();
  clearSquareSyncStatus();
  maybeAutoSquareToday();
  renderRequiredQueue();
  renderTodayExecutionState();
}

// ── CLOSE & RESET ──
// Runs at end of day. Answers: "Is tomorrow executable?"
// Queue state lives at S.ui.queue — no new tables, no new persist paths.

const ANCHOR_ITEMS = [
  { key: 'bananas',      label: 'Bananas' },
  { key: 'oatMilk',     label: 'Oat milk' },
  { key: 'salmon',      label: 'Salmon' },
  { key: 'bread',       label: 'Bread' },
  { key: 'acai',        label: 'Açaí base' },
  { key: 'granola',     label: 'Granola' },
  { key: 'peanutButter',label: 'Peanut butter' },
];

const SUPPLIER_OPTIONS = ['Costco', 'Zak', "Perl'a", 'Restaurant Depot', 'Instacart/Sprouts', 'Other'];

function getTodayQueueKey() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function getQueue() {
  if (!S.ui.queue || typeof S.ui.queue !== 'object') S.ui.queue = {};
  const todayKey = getTodayQueueKey();
  if (!S.ui.queue[todayKey] || typeof S.ui.queue[todayKey] !== 'object') {
    S.ui.queue[todayKey] = {};
  }
  return S.ui.queue[todayKey];
}

function saveQueue() {
  // Prune old queue days (keep last 7)
  if (S.ui.queue) {
    const keys = Object.keys(S.ui.queue).sort().reverse();
    keys.slice(7).forEach(k => delete S.ui.queue[k]);
  }
  save('app');
}

function isQueueItemDone(q, item) {
  if (item === 'squareSync') {
    // Resolve from existing log: today's log has a squareSyncedAt
    const todayLog = S.logs[0];
    if (todayLog && todayLog.squareSyncedAt) {
      const sinceMs = Date.now() - Number(todayLog.squareSyncedAt);
      return sinceMs < 8 * 60 * 60 * 1000; // synced within 8 hours
    }
    return false;
  }
  if (item === 'anchorInv') return !!(q.anchorInvSaved);
  if (item === 'supplierSpend') return !!(q.supplierSpendSaved);
  if (item === 'observation') return !!(q.observationSaved);
  if (item === 'weeklyReview') {
    const lastReview = S.reviews[0];
    return !!(lastReview && daysSince(lastReview.savedAt) <= 8);
  }
  if (item === 'sundayDJ') {
    return !!(S.sunday && (S.sunday.status === 'confirmed' || S.sunday.status === 'outreach'));
  }
  return false;
}

function queueItemVisible(item) {
  if (item === 'sundayDJ') {
    // Show Wed–Sun (days 3, 4, 5, 6, 0) — enough runway to confirm
    const d = getMiamiNow().day;
    return d === 3 || d === 4 || d === 5 || d === 6 || d === 0;
  }
  if (item === 'weeklyReview') {
    // Show Sun + Mon if not done
    const d = getMiamiNow().day;
    return (d === 0 || d === 1) && !isQueueItemDone(getQueue(), 'weeklyReview');
  }
  return true;
}

function renderRequiredQueue() {
  const el = document.getElementById('required-today-queue');
  if (!el) return;

  const q = getQueue();
  const items = [
    { id: 'squareSync',    label: 'Sync Square',               always: true },
    { id: 'anchorInv',     label: 'Stock check — 7 anchors',   always: true },
    { id: 'supplierSpend', label: 'Log any supplier spend',     always: true },
    { id: 'observation',   label: 'One thing from today',       always: true },
    { id: 'weeklyReview',  label: 'Weekly review',              always: false },
    { id: 'sundayDJ',      label: 'Sunday DJ confirmed',        always: false },
  ];

  const visible = items.filter(i => i.always || queueItemVisible(i.id));
  const pending = visible.filter(i => !isQueueItemDone(q, i.id));
  const allDone = pending.length === 0;

  const headerColor = allDone ? 'var(--green)' : 'var(--ink)';
  const headerText = allDone
    ? 'Tomorrow is ready ✓'
    : `Close & reset — ${pending.length} left`;
  const subText = allDone
    ? 'Walk in tomorrow and execute.'
    : 'Do this before you leave. Tomorrow should already be resolved.';

  let html = `<div style="border:1.5px solid var(--border);border-radius:8px;overflow:hidden;">
    <div style="background:${allDone ? 'var(--green-light)' : 'var(--surface)'};padding:11px 14px 10px;border-bottom:1px solid var(--border);">
      <div style="font-size:13px;letter-spacing:0.10em;text-transform:uppercase;font-weight:600;color:${headerColor};margin-bottom:2px;">${headerText}</div>
      <div style="font-size:13px;color:var(--ink-light);">${subText}</div>
    </div>`;

  // ── 1. Square Sync ──
  const syncDone = isQueueItemDone(q, 'squareSync');
  html += renderQueueRow('squareSync', 'Sync Square', syncDone, `
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:8px;">Lock today's numbers before you leave.</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick="queueSyncSquare()" style="font-size:13px;">${syncDone ? 'Re-sync' : 'Sync now'}</button>
      <span id="queue-square-status" style="font-size:13px;color:var(--ink-light);">${syncDone ? 'Synced ✓' : 'Not synced yet today'}</span>
    </div>`);

  // ── 2. Anchor Stock Check ──
  const invDone = isQueueItemDone(q, 'anchorInv');
  const savedInv = q.anchorInv || {};
  const criticalItems = ANCHOR_ITEMS.filter(a => savedInv[a.key] === 'critical').map(a => a.label);
  const lowItems = ANCHOR_ITEMS.filter(a => savedInv[a.key] === 'low').map(a => a.label);
  const invInputs = ANCHOR_ITEMS.map(a => {
    const val = savedInv[a.key] || '';
    const btnClass = (s) => s === val ? 'btn btn-sm' + (s === 'healthy' ? ' btn-g' : s === 'low' ? ' btn-a' : ' btn-c') : 'btn btn-sm btn-o';
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
      <span style="width:105px;font-size:13px;color:var(--ink);">${a.label}</span>
      <button class="${btnClass('healthy')}" onclick="queueSetInv('${a.key}','healthy')" style="font-size:11px;padding:3px 8px;">Good</button>
      <button class="${btnClass('low')}" onclick="queueSetInv('${a.key}','low')" style="font-size:11px;padding:3px 8px;">Low</button>
      <button class="${btnClass('critical')}" onclick="queueSetInv('${a.key}','critical')" style="font-size:11px;padding:3px 8px;">Order</button>
    </div>`;
  }).join('');
  const allInvSet = ANCHOR_ITEMS.every(a => savedInv[a.key]);
  const invSubLabel = invDone
    ? (criticalItems.length ? `Order needed: ${criticalItems.join(', ')}` : lowItems.length ? `Low: ${lowItems.join(', ')}` : 'All good for tomorrow')
    : 'What ran low today? What needs ordering?';
  html += renderQueueRow('anchorInv', 'Stock check — 7 anchors', invDone, `
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:8px;">${invSubLabel}</div>
    <div style="margin-bottom:8px;">${invInputs}</div>
    <button class="btn btn-sm${allInvSet ? '' : ' btn-o'}" onclick="queueSaveInv()" style="font-size:13px;">${invDone ? 'Updated ✓' : 'Save stock check'}</button>`);

  // ── 3. Supplier Spend ──
  const spendDone = isQueueItemDone(q, 'supplierSpend');
  const savedSpend = q.supplierSpend || {};
  const spendInputs = SUPPLIER_OPTIONS.map(s => {
    const key = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const val = savedSpend[key] || '';
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
      <span style="width:120px;font-size:13px;color:var(--ink);">${s}</span>
      <span style="font-size:13px;color:var(--ink-light);">$</span>
      <input type="number" id="qspend-${key}" placeholder="0" value="${val}" style="width:80px;font-size:13px;padding:4px 7px;" oninput="queueUpdateSpend('${key}',this.value)">
    </div>`;
  }).join('');
  html += renderQueueRow('supplierSpend', 'Log any supplier spend', spendDone, `
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:8px;">Any Costco run, delivery, or order today? Log it now. Skip if nothing spent.</div>
    <div style="margin-bottom:8px;">${spendInputs}</div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick="queueSaveSpend()" style="font-size:13px;">${spendDone ? 'Saved ✓ · update' : 'Save spend'}</button>
      <button class="btn btn-sm btn-o" onclick="queueSkipSpend()" style="font-size:13px;">${spendDone ? '' : 'Nothing today'}</button>
    </div>`);

  // ── 4. One thing from today ──
  const obsDone = isQueueItemDone(q, 'observation');
  const savedObs = q.observation || '';
  html += renderQueueRow('observation', 'One thing from today', obsDone, `
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:8px;">What did you notice? One sentence. No structure needed.</div>
    <input type="text" id="queue-obs-input" placeholder="e.g. Salmon moved fast. Walk-ins asking for matcha." value="${savedObs.replace(/"/g,'&quot;')}"
      style="width:100%;font-size:14px;padding:6px 9px;margin-bottom:8px;"
      onkeydown="if(event.key==='Enter')queueSaveObs()">
    <div style="display:flex;align-items:center;gap:8px;">
      <button class="btn btn-sm" onclick="queueSaveObs()" style="font-size:13px;">${obsDone ? 'Saved ✓ · update' : 'Save'}</button>
    </div>`);

  // ── 5. Weekly Review (conditional) ──
  if (queueItemVisible('weeklyReview')) {
    const rvDone = isQueueItemDone(q, 'weeklyReview');
    html += renderQueueRow('weeklyReview', 'Weekly review', rvDone, `
      <div style="font-size:13px;color:var(--ink-light);margin-bottom:8px;">10 minutes. Numbers + one priority. Do it before you close out the week.</div>
      <button class="btn btn-sm" onclick="nav('review',null)" style="font-size:13px;">Open Weekly Review →</button>`);
  }

  // ── 6. Sunday DJ (conditional) ──
  if (queueItemVisible('sundayDJ')) {
    const djDone = isQueueItemDone(q, 'sundayDJ');
    const djStatus = S.sunday && S.sunday.status;
    const djName = S.sunday && S.sunday.dj ? S.sunday.dj : '';
    const djSubLabel = djDone
      ? (djName ? `${djName} · ${djStatus}` : djStatus)
      : 'Sunday needs to be locked before Friday.';
    html += renderQueueRow('sundayDJ', 'Sunday DJ confirmed', djDone, `
      <div style="font-size:13px;color:${djDone ? 'var(--green)' : 'var(--ink-light)'};margin-bottom:8px;">${djSubLabel}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="queue-dj-name" placeholder="@djhandle" value="${djName.replace(/"/g,'&quot;')}" style="width:130px;font-size:13px;padding:5px 8px;">
        <button class="btn btn-sm btn-o" onclick="queueSetDJ('outreach')" style="font-size:12px;">Outreach sent</button>
        <button class="btn btn-sm" onclick="queueSetDJ('confirmed')" style="font-size:12px;">Confirmed ✓</button>
      </div>`);
  }

  html += '</div>';
  el.innerHTML = html;
}

function renderQueueRow(id, label, done, bodyHtml) {
  const dotColor = done ? 'var(--green)' : 'var(--amber)';
  const labelColor = done ? 'var(--ink-light)' : 'var(--ink)';
  const expandKey = 'queue-expanded-' + id;
  const isExpanded = !done || (sessionStorage.getItem(expandKey) === '1');

  return `<div style="border-bottom:1px solid var(--border);padding:0;">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;user-select:none;"
      onclick="queueToggleExpand('${id}')">
      <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:${done ? '400' : '500'};color:${labelColor};flex:1;${done ? 'text-decoration:none;' : ''}">${label}</span>
      ${done ? '<span class="badge bg" style="font-size:11px;">Done</span>' : ''}
      <span style="font-size:12px;color:var(--ink-light);padding-left:4px;">${isExpanded ? '▲' : '▼'}</span>
    </div>
    <div id="queue-body-${id}" style="padding:${isExpanded ? '0 14px 12px' : '0'};display:${isExpanded ? 'block' : 'none'};">
      ${bodyHtml}
    </div>
  </div>`;
}

function queueToggleExpand(id) {
  const body = document.getElementById('queue-body-' + id);
  const expandKey = 'queue-expanded-' + id;
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  if (isOpen) {
    body.style.display = 'none';
    body.style.padding = '0';
    sessionStorage.setItem(expandKey, '0');
  } else {
    body.style.display = 'block';
    body.style.padding = '0 14px 12px';
    sessionStorage.setItem(expandKey, '1');
  }
  // Update arrow
  const row = body.previousElementSibling;
  if (row) {
    const arrow = row.querySelector('span:last-child');
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  }
}

function queueSyncSquare() {
  syncSquareToday({ mode: 'manual' });
  // Slight delay then re-render to pick up sync state
  setTimeout(() => renderRequiredQueue(), 1800);
}

function queueSetInv(key, value) {
  const q = getQueue();
  if (!q.anchorInv) q.anchorInv = {};
  q.anchorInv[key] = value;
  saveQueue();
  renderRequiredQueue();
}

function queueUpdateSpend(key, value) {
  const q = getQueue();
  if (!q.supplierSpendDraft) q.supplierSpendDraft = {};
  q.supplierSpendDraft[key] = value;
  // Don't persist draft on every keystroke — wait for Save
}

function queueSaveInv() {
  const q = getQueue();
  if (!q.anchorInv) { alert('Check at least one item first.'); return; }
  const allSet = ANCHOR_ITEMS.every(a => q.anchorInv[a.key]);
  if (!allSet) {
    const missing = ANCHOR_ITEMS.filter(a => !q.anchorInv[a.key]).map(a => a.label).join(', ');
    if (!confirm(`Not all items checked. Missing: ${missing}. Save anyway?`)) return;
  }
  q.anchorInvSaved = Date.now();
  // Write into S.ui.anchorSafetyState for downstream risk logic
  S.ui.anchorSafetyState = { ...q.anchorInv, savedAt: q.anchorInvSaved };
  saveQueue();
  renderRequiredQueue();
}

function queueSaveSpend() {
  const q = getQueue();
  // Read from DOM inputs
  const draft = {};
  let hasAny = false;
  SUPPLIER_OPTIONS.forEach(s => {
    const key = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const el = document.getElementById('qspend-' + key);
    if (el) {
      const val = parseFloat(el.value) || 0;
      draft[key] = el.value || '';
      if (val > 0) hasAny = true;
    }
  });
  if (!hasAny) { alert('Enter at least one spend amount.'); return; }
  q.supplierSpend = draft;
  q.supplierSpendSaved = Date.now();

  // ── Propagate into S.ui.inventorySpend (same structure calcWeeklySpend reads) ──
  // Map queue supplier keys to existing spend field IDs
  const queueToSpendMap = {
    costco: 'costco',
    zak: 'other',     // Zak the Baker → other column for now
    perla: 'perla',
    restaurantdepot: 'depot',
    instacartsprouts: 'other',
    other: 'other',
  };

  if (!S.ui.inventorySpend) S.ui.inventorySpend = {};

  // Accumulate mapped values
  const accumulated = { costco: 0, depot: 0, other: 0, amazon: 0, perla: 0 };
  Object.entries(draft).forEach(([k, v]) => {
    const target = queueToSpendMap[k] || 'other';
    accumulated[target] = (accumulated[target] || 0) + (parseFloat(v) || 0);
  });

  // Only overwrite non-zero mappings to avoid clobbering amazon entries
  if (accumulated.costco) S.ui.inventorySpend.costco = String(accumulated.costco);
  if (accumulated.depot)  S.ui.inventorySpend.depot  = String(accumulated.depot);
  if (accumulated.other)  S.ui.inventorySpend.other  = String(accumulated.other);
  if (accumulated.perla)  S.ui.inventorySpend.perla  = String(accumulated.perla);

  saveQueue();
  renderRequiredQueue();
  // Sync downstream spend result if Ops page is visible
  const opsPage = document.getElementById('page-ops');
  if (opsPage && opsPage.classList.contains('active')) calcWeeklySpend();
}

function queueSaveObs() {
  const input = document.getElementById('queue-obs-input');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) { alert('Enter a one-line observation first.'); return; }
  const q = getQueue();
  q.observation = txt;
  q.observationSaved = Date.now();

  // ── Propagate into S.notes — same store as Ops Notes ──
  const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  // Prefix with [Queue] to distinguish queue entries
  const noteText = '[Daily] ' + txt;
  // Avoid duplicate if already saved today
  if (!S.notes.length || S.notes[0].text !== noteText) {
    S.notes.unshift({ date: d, text: noteText, source: 'queue' });
    if (S.notes.length > 30) S.notes.pop();
    save('notes');
  }
  saveQueue();
  renderRequiredQueue();
}

function queueSkipSpend() {
  const q = getQueue();
  q.supplierSpend = { skipped: true };
  q.supplierSpendSaved = Date.now();
  saveQueue();
  renderRequiredQueue();
}

function queueSetDJ(status) {
  const input = document.getElementById('queue-dj-name');
  const djName = input ? input.value.trim() : '';
  const statusEl = document.getElementById('sun-status');
  const djEl = document.getElementById('sun-dj');
  if (statusEl) statusEl.value = status;
  if (djEl) djEl.value = djName;
  // Use existing saveSunday() — propagates to all downstream renders
  saveSunday();
  renderRequiredQueue();
}

function renderTodayExecutionState() {
  // Sunday card
  const sundayVal = document.getElementById('today-sunday-val');
  const sundaySub = document.getElementById('today-sunday-sub');
  const sundayCard = document.getElementById('today-sunday-state');
  if (sundayVal && S.sunday) {
    const status = S.sunday.status;
    const dj = S.sunday.dj || '';
    if (status === 'confirmed') {
      sundayVal.textContent = 'Confirmed';
      sundaySub.textContent = dj || '10am–3pm';
      if (sundayCard) sundayCard.style.borderLeft = '3px solid var(--green)';
    } else if (status === 'outreach') {
      sundayVal.textContent = 'Outreach sent';
      sundaySub.textContent = dj || 'Waiting on confirmation';
      if (sundayCard) sundayCard.style.borderLeft = '3px solid var(--amber)';
    } else {
      sundayVal.textContent = 'Not booked';
      sundaySub.textContent = 'Needs booking';
      if (sundayCard) sundayCard.style.borderLeft = '3px solid var(--red)';
    }
  }

  // Square sync card
  const squareVal = document.getElementById('today-square-val');
  const squareSub = document.getElementById('today-square-sub');
  const squareCard = document.getElementById('today-square-state');
  if (squareVal) {
    const todayLog = S.logs[0];
    if (todayLog && todayLog.squareSyncedAt) {
      const mins = Math.round((Date.now() - Number(todayLog.squareSyncedAt)) / 60000);
      squareVal.textContent = 'Synced';
      squareSub.textContent = mins < 60 ? `${mins}m ago` : `${Math.round(mins/60)}h ago`;
      if (squareCard) squareCard.style.borderLeft = '3px solid var(--green)';
    } else {
      squareVal.textContent = 'Not synced';
      squareSub.textContent = 'Tap Sync Square';
      if (squareCard) squareCard.style.borderLeft = '3px solid var(--ink-faint)';
    }
  }
}

function highlightRunbookDay() {
  const rows = document.querySelectorAll('[data-runbook-day]');
  if (!rows.length) return;
  const today = String(new Date().getDay());
  rows.forEach(row => {
    const key = row.getAttribute('data-runbook-day');
    const active = key === 'daily' || key === today;
    row.style.background = active ? 'rgba(190, 154, 104, 0.10)' : 'transparent';
    row.style.borderRadius = active ? '5px' : '0';
    row.style.padding = active ? '6px 7px' : '';
    row.style.margin = active ? '2px 0' : '';
  });
}

function daysSince(ts) {
  if (!ts) return 9999;
  const n = Number(ts);
  if (!n) return 9999;
  return (Date.now() - n) / 86400000;
}

function renderCadenceLock() {
  const el = document.getElementById('cadence-lock');
  if (!el) return;

  const lastLog = S.logs[0] || null;
  const lastReview = S.reviews[0] || null;
  const lastMonthly = S.monthlies[0] || null;

  const dailyDone = daysSince(lastLog && lastLog.loggedAt) <= 1.2;
  const weeklyDone = daysSince(lastReview && lastReview.savedAt) <= 8;
  const monthlyDone = daysSince(lastMonthly && lastMonthly.savedAt) <= 35;

  const doneCount = [dailyDone, weeklyDone, monthlyDone].filter(Boolean).length;
  const tone = doneCount === 3 ? 'al-g' : doneCount === 2 ? 'al-a' : 'al-c';
  const nextAction = !dailyDone
    ? 'Next action: complete today log before close.'
    : !weeklyDone
      ? 'Next action: save Weekly Review on Sunday close.'
      : !monthlyDone
        ? 'Next action: complete Monthly lock this week.'
        : 'Cadence complete. Keep execution boring.';

  const statusBadge = done => done ? '<span class="badge bg">Done</span>' : '<span class="badge br">Missing</span>';

  el.innerHTML = `<div class="alert ${tone}" style="margin-bottom:0;">
    <strong>Cadence lock</strong><br>
    <span style="font-size:14px;">${nextAction}</span>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:7px;">
      <div style="background:var(--surface);border-radius:5px;padding:7px 8px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:14px;">Daily log</span>${statusBadge(dailyDone)}</div>
      <div style="background:var(--surface);border-radius:5px;padding:7px 8px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:14px;">Weekly review</span>${statusBadge(weeklyDone)}</div>
      <div style="background:var(--surface);border-radius:5px;padding:7px 8px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:14px;">Monthly lock</span>${statusBadge(monthlyDone)}</div>
    </div>
  </div>`;
}

function renderWeekChecks(target) {
  const el = document.getElementById(target);
  if (!el) return;
  el.innerHTML = weekChecks.map(c => {
    const done = S.checks[c.id];
    return `<div class="ci" onclick="toggleCheck('${c.id}', '${target}')">
      <div class="cb${done ? ' on' : ''}"></div>
      <div class="cb-body">
        <div class="cb-main${done ? ' done' : ''}">${c.text}</div>
        ${c.note ? `<div class="cb-note">${c.note}</div>` : ''}
      </div>
      <span class="badge bn" style="margin-left:auto;margin-top:1px;">${c.tag}</span>
    </div>`;
  }).join('');
}

function toggleCheck(id, target) {
  S.checks[id] = !S.checks[id];
  save('checks');
  renderWeekChecks(target);
  if (target === 'week-checks-today') renderWeekChecks('week-checks-main');
  else renderWeekChecks('week-checks-today');
}

function logDay() {
  const lever = document.getElementById('today-lever-choice')?.value || '';
  if (!lever) {
    alert('Pick today\'s lever before logging.');
    return;
  }
  const d = document.getElementById('l-date').value.trim();
  const r = parseFloat(document.getElementById('l-rev').value);
  const o = document.getElementById('l-orders').value.trim();
  const t = document.getElementById('l-topitem').value.trim();
  const c = document.getElementById('l-contacts').value.trim();
  const l = document.getElementById('l-loyalty').value.trim();
  const ordersN = parseFloat(o);
  const loyaltyN = parseFloat(l);
  if (!o || isNaN(ordersN) || ordersN < 0) {
    alert('Enter orders before logging.');
    return;
  }
  if (l && (isNaN(loyaltyN) || loyaltyN < 0)) {
    alert('Loyalty signups must be a valid number.');
    return;
  }
  if (!d || isNaN(r)) return;
  const dateIso = todayIsoDate();
  const synced = S.ui.squareTodaySummary || {};
  const hasSquareContext = synced.date === dateIso;
  const existingIdx = findTodayLogIndex(dateIso, d);
  const nextEntry = {
    date: d,
    dateIso,
    rev: r,
    orders: o,
    top: t,
    contacts: c,
    loyalty: l,
    source: hasSquareContext ? 'manual+square' : 'manual',
    squareSyncedAt: hasSquareContext ? (synced.syncedAt || Date.now()) : '',
    squareTopItems: hasSquareContext ? (synced.topItems || []) : [],
    squareSalesByHour: hasSquareContext ? (synced.salesByHour || []) : [],
    loggedAt: Date.now(),
  };
  if (existingIdx >= 0) {
    const existing = S.logs[existingIdx] || {};
    S.logs[existingIdx] = {
      ...existing,
      ...nextEntry,
      source: hasSquareContext ? 'manual+square' : (existing.source || 'manual'),
      // Keep Square context from either today's sync or prior saved square facts.
      squareSyncedAt: hasSquareContext ? nextEntry.squareSyncedAt : (existing.squareSyncedAt || ''),
      squareTopItems: hasSquareContext ? nextEntry.squareTopItems : (existing.squareTopItems || []),
      squareSalesByHour: hasSquareContext ? nextEntry.squareSalesByHour : (existing.squareSalesByHour || []),
    };
    if (existingIdx > 0) {
      const [updated] = S.logs.splice(existingIdx, 1);
      S.logs.unshift(updated);
    }
  } else {
    S.logs.unshift(nextEntry);
  }
  if (S.logs.length > 40) S.logs.pop();
  save('logs');
  ['l-rev', 'l-orders', 'l-topitem', 'l-contacts', 'l-loyalty'].forEach(id => document.getElementById(id).value = '');
  renderLogHist('log-hist');
  renderLogHist('pnl-log-hist');
  updateWTD();
  renderSundayBlock();
  renderWeeklyLever();
  updatePaceLine();
  renderCadenceLock();
}

function clearSquareSyncStatus() {
  const el = document.getElementById('square-sync-status');
  if (!el) return;
  el.style.display = 'none';
  el.textContent = '';
  el.style.color = 'var(--ink-light)';
}

function setSquareSyncStatus(msg, tone = 'muted') {
  const el = document.getElementById('square-sync-status');
  if (!el) return;
  const tones = {
    muted: 'var(--ink-light)',
    ok: 'var(--green)',
    warn: 'var(--amber)',
    err: 'var(--red)',
  };
  el.style.display = 'block';
  el.style.color = tones[tone] || tones.muted;
  el.textContent = msg;
}

function todayIsoDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = t => parts.find(p => p.type === t)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

function formatIsoDateToLabel(isoDate) {
  if (!isoDate) return '';
  const dt = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(dt.getTime())) return isoDate;
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getMiamiNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = t => parts.find(p => p.type === t)?.value || '';
  const wk = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: wk[pick('weekday')] ?? new Date().getDay(),
    hour: Number(pick('hour') || 0),
    minute: Number(pick('minute') || 0),
  };
}

function isAfterCloseMiami() {
  const n = getMiamiNow();
  const endHour = (n.day >= 3 && n.day <= 5) || n.day === 6 || n.day === 0 ? 17 : null;
  if (endHour === null) return false;
  return n.hour > endHour || (n.hour === endHour && n.minute >= 0);
}

function findTodayLogIndex(dateIso, dateLabel) {
  return S.logs.findIndex(log => (log.dateIso && log.dateIso === dateIso) || log.date === dateLabel);
}

function upsertSquareFacts(summary, mode) {
  const dateIso = summary.date || todayIsoDate();
  const dateLabel = formatIsoDateToLabel(dateIso);
  const idx = findTodayLogIndex(dateIso, dateLabel);
  const rev = Number(summary.grossSales || 0);
  const orders = String(summary.orderCount || 0);
  const top = summary.topItems && summary.topItems[0] ? summary.topItems[0].name : '';
  const nowTs = Date.now();
  const squareTopItems = Array.isArray(summary.topItems) ? summary.topItems : [];
  const squareSalesByHour = Array.isArray(summary.salesByHour) ? summary.salesByHour : [];

  if (idx >= 0) {
    const existing = S.logs[idx] || {};
    S.logs[idx] = {
      ...existing,
      date: dateLabel,
      dateIso,
      rev,
      orders,
      top,
      source: 'square',
      squareSyncedAt: nowTs,
      squareAutoSavedAt: mode === 'auto' ? nowTs : (existing.squareAutoSavedAt || ''),
      squareTopItems,
      squareSalesByHour,
    };
    save('logs');
    return { mode: 'updated', preservedManual: !!((existing.contacts && existing.contacts.trim()) || (existing.loyalty && existing.loyalty.trim())) };
  }

  if (rev <= 0 && Number(summary.orderCount || 0) <= 0) {
    return { mode: 'none', preservedManual: false };
  }

  S.logs.unshift({
    date: dateLabel,
    dateIso,
    rev,
    orders,
    top,
    contacts: '',
    loyalty: '',
    source: 'square',
    squareSyncedAt: nowTs,
    squareAutoSavedAt: mode === 'auto' ? nowTs : '',
    squareTopItems,
    squareSalesByHour,
    loggedAt: nowTs,
  });
  if (S.logs.length > 40) S.logs.pop();
  save('logs');
  return { mode: 'created', preservedManual: false };
}

function rerenderTodayAfterSquareSave() {
  renderLogHist('log-hist');
  renderLogHist('pnl-log-hist');
  updateWTD();
  renderSundayBlock();
  renderWeeklyLever();
  updatePaceLine();
  renderCadenceLock();
  renderRequiredQueue();
  renderTodayExecutionState();
}

async function syncSquareToday(opts = {}) {
  const mode = opts.mode || 'manual';
  const quiet = opts.quiet === true;
  const autoSaveEligible = opts.autoSaveEligible === true;
  if (!quiet) setSquareSyncStatus('Syncing Square...', 'muted');
  const date = todayIsoDate();
  try {
    const res = await fetch('/api/square/daily-summary?date=' + encodeURIComponent(date), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = body && body.code ? body.code : 'SQUARE_ERROR';
      if (code === 'NO_SALES') setSquareSyncStatus('No Square sales yet.', 'muted');
      else if (code === 'TOKEN_MISSING') setSquareSyncStatus('Square token missing in server env.', 'err');
      else if (code === 'LOCATION_MISSING') setSquareSyncStatus('Square location missing in server env.', 'err');
      else setSquareSyncStatus('Square sync unavailable. Manual log still works.', 'warn');
      return;
    }

    const summary = body.summary || {};
    if (!S.ui.squareTodaySummary || typeof S.ui.squareTodaySummary !== 'object') S.ui.squareTodaySummary = {};
    S.ui.squareTodaySummary = {
      date: summary.date || date,
      syncedAt: Date.now(),
      topItems: Array.isArray(summary.topItems) ? summary.topItems : [],
      salesByHour: Array.isArray(summary.salesByHour) ? summary.salesByHour : [],
    };
    save('app');
    document.getElementById('l-date').value = formatIsoDateToLabel(summary.date || date);
    document.getElementById('l-rev').value = String(Math.round(summary.grossSales || 0));
    document.getElementById('l-orders').value = String(summary.orderCount || 0);
    document.getElementById('l-topitem').value = summary.topItems && summary.topItems[0] ? summary.topItems[0].name : '';

    const ticket = Number(summary.averageTicket || 0);
    const gross = Math.round(summary.grossSales || 0);
    const orders = Number(summary.orderCount || 0);

    if (mode === 'auto' && autoSaveEligible) {
      const upsert = upsertSquareFacts(summary, 'auto');
      if (upsert.mode === 'none') {
        setSquareSyncStatus('No Square sales yet.', 'muted');
      } else {
        rerenderTodayAfterSquareSave();
        if (upsert.preservedManual) setSquareSyncStatus('Manual edits preserved', 'ok');
        else setSquareSyncStatus('Saved from Square · $' + gross + ' · ' + orders + ' orders', 'ok');
      }
      return;
    }

    if (mode === 'auto') {
      setSquareSyncStatus('Square ready · auto-save after close', 'muted');
      return;
    }

    setSquareSyncStatus('Square synced · $' + gross + ' · ' + orders + ' orders · avg $' + ticket.toFixed(2), 'ok');
  } catch (err) {
    setSquareSyncStatus('Square sync unavailable. Manual log still works.', 'warn');
  }
}

function maybeAutoSquareToday() {
  const syncKey = 'h-square-auto-sync-done';
  const saveKey = 'h-square-auto-save-done';
  const alreadySynced = sessionStorage.getItem(syncKey) === '1';
  const alreadySaved = sessionStorage.getItem(saveKey) === '1';
  const afterClose = isAfterCloseMiami();
  if (!alreadySynced) {
    sessionStorage.setItem(syncKey, '1');
    syncSquareToday({ mode: 'auto', quiet: true, autoSaveEligible: afterClose && !alreadySaved });
    if (afterClose && !alreadySaved) sessionStorage.setItem(saveKey, '1');
    return;
  }
  if (afterClose && !alreadySaved) {
    sessionStorage.setItem(saveKey, '1');
    syncSquareToday({ mode: 'auto', quiet: true, autoSaveEligible: true });
  }
}

function saveTodayLever() {
  const lever = document.getElementById('today-lever-choice')?.value || '';
  setTodayLever({ value: lever, manual: lever ? '1' : '0', dayKey: null });
  persistKey('app');
}

function loadTodayLever() {
  const el = document.getElementById('today-lever-choice');
  if (!el) return;
  const dayKey = new Date().toLocaleDateString('en-CA');
  const st = getTodayLever();
  if (st.day !== dayKey) {
    setTodayLever({ value: '', manual: '0', dayKey });
    persistKey('app');
  }
  const saved = getTodayLever().value || '';
  if (saved) el.value = saved;
}

function suggestTodayLever(riskLabel) {
  const el = document.getElementById('today-lever-choice');
  if (!el) return;
  const manual = getTodayLever().manual === '1';
  if (manual && el.value) return;

  let suggestion = 'Collect 10 SMS numbers';
  if (riskLabel === 'Revenue Risk') suggestion = 'Push bundle script on every order';
  else if (riskLabel === 'Margin Risk' || riskLabel === 'Both At Risk') suggestion = 'Tighten one portion (salmon or avocado)';
  else if (riskLabel === 'On Track') suggestion = 'Collect 10 SMS numbers';

  el.value = suggestion;
  setTodayLever({ value: suggestion, manual: '0', dayKey: null });
  persistKey('app');
}

function renderLogHist(target) {
  const el = document.getElementById(target);
  if (!el) return;
  if (!S.logs.length) { el.innerHTML = '<div style="font-size:14px;color:var(--ink-light);padding:3px 0;">No entries yet</div>'; return; }
  el.innerHTML = S.logs.slice(0, 8).map(l => {
    const cls = l.rev >= DAILY_FLOOR_TARGET ? 'g' : l.rev < 300 ? 'l' : '';
    const contactStr = l.contacts ? ` · ${l.contacts} new` : '';
    const loyaltyStr = l.loyalty ? ` · ${l.loyalty} loyalty` : '';
    return `<div class="le">
      <span>${l.date}${l.top ? ' · ' + l.top : ''}${contactStr}${loyaltyStr}</span>
      <span>${l.orders ? l.orders + ' orders · ' : ''}<span class="le-rev ${cls}">$${l.rev.toLocaleString()}</span></span>
    </div>`;
  }).join('');
}

function updateWTD() {
  const total = S.logs.slice(0, 7).reduce((s, l) => s + l.rev, 0);
  const pct = Math.min(100, Math.round(total / GROSS_TARGET * 100));
  const wtdEl = document.getElementById('sc-wtd');
  if (wtdEl) wtdEl.textContent = '$' + total.toLocaleString();
  const gapEl = document.getElementById('sc-wtd-gap');
  const remaining = GROSS_TARGET - total;
  if (gapEl) {
    if (remaining <= 0) { gapEl.textContent = '✓ $4k net target reached'; gapEl.style.color = 'var(--green)'; }
    else if (total >= PHASE1_TARGET) { gapEl.textContent = 'Phase 2+ hit · $' + remaining.toLocaleString() + ' to $8,914'; gapEl.style.color = 'var(--amber)'; }
    else { gapEl.textContent = '$' + remaining.toLocaleString() + ' to gross $8,914 target'; gapEl.style.color = 'var(--ink-light)'; }
  }
  const bar = document.getElementById('wtd-bar');
  if (bar) { bar.style.width = pct + '%'; bar.className = 'prog-f ' + (pct >= 80 ? 'g' : pct >= 50 ? 'w' : 'd'); }
  const wtdMetric = document.getElementById('sc-wtd-metric');
  if (wtdMetric) wtdMetric.style.borderLeft = '3px solid ' + (total >= GROSS_TARGET ? 'var(--green)' : total >= PHASE1_TARGET ? 'var(--amber)' : 'var(--ink-faint)');
  // Today
  if (S.logs.length) {
    const r = S.logs[0].rev;
    const todayEl = document.getElementById('sc-today');
    if (todayEl) todayEl.textContent = '$' + r.toLocaleString();
    const gapToday = document.getElementById('sc-today-gap');
    if (gapToday) {
      const diffFloor = r - DAILY_FLOOR_TARGET;
      if (diffFloor >= 0) {
        gapToday.textContent = '+$' + diffFloor + ' above $500 floor';
        gapToday.style.color = 'var(--green)';
      } else {
        gapToday.textContent = '$' + Math.abs(diffFloor) + ' below $500 floor';
        gapToday.style.color = 'var(--accent)';
      }
    }
    const todayMetric = document.getElementById('sc-today-metric');
    if (todayMetric) todayMetric.style.borderLeft = '3px solid ' + (r >= DAILY_FLOOR_TARGET ? 'var(--green)' : r >= 350 ? 'var(--amber)' : 'var(--red)');
  }
  renderWeeklyRisk();
  renderCaptureStatus();
}

function updatePaceLine() {
  const el = document.getElementById('today-pace-line');
  if (!el) return;
  if (!S.logs.length) {
    el.textContent = 'Sync Square to see today\'s numbers.';
    el.style.color = 'var(--ink-mid)';
    return;
  }
  const todayRev = S.logs[0].rev;
  const diffFloor = todayRev - DAILY_FLOOR_TARGET;
  if (todayRev >= DAILY_TARGET) {
    el.textContent = 'Strong day. $' + todayRev.toLocaleString() + ' — above north star.';
    el.style.color = 'var(--green)';
  } else if (diffFloor >= 0) {
    el.textContent = '$500 floor reached. $' + todayRev.toLocaleString() + ' today.';
    el.style.color = 'var(--green)';
  } else if (todayRev >= 350) {
    el.textContent = '$' + todayRev.toLocaleString() + ' today — $' + Math.abs(diffFloor) + ' from floor.';
    el.style.color = 'var(--amber)';
  } else {
    el.textContent = '$' + todayRev.toLocaleString() + ' today. Slow day — note what you observed.';
    el.style.color = 'var(--ink-mid)';
  }
}

function renderSundayBlock() {
  const el = document.getElementById('sunday-block');
  if (!el) return;
  const s = S.sunday || {};
  const confirmed = s.status === 'confirmed';
  const outreach = s.status === 'outreach';
  const djName = s.dj || '';
  if (confirmed) {
    el.innerHTML = `<div style="background:var(--green-light);border:1px solid var(--green);border-radius:6px;padding:12px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--green);margin-bottom:2px;">Sunday Slot — Infrastructure</div>
          <div style="font-size:15px;color:var(--ink);font-weight:500;">${djName ? djName + ' · confirmed' : 'DJ confirmed'} · 10am–3pm</div>
        </div>
        <span class="badge bg">Locked</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px;">
        <button class="btn btn-sm" onclick="editSundaySlot()">Edit</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>`;
  } else if (outreach) {
    el.innerHTML = `<div style="background:var(--amber-light);border:2px solid var(--amber);border-radius:6px;padding:12px 16px;">
      <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--amber);margin-bottom:4px;">Sunday Slot — Outreach Sent</div>
      <div style="font-size:14px;color:var(--ink);margin-bottom:8px;">${djName || 'DJ'} — waiting on confirmation. Follow up today.</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="sun-dj-inline" placeholder="@djhandle" value="${djName}" style="width:140px;" oninput="document.getElementById('sun-dj').value=this.value">
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='confirmed';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Confirm</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>`;
  } else {
    el.innerHTML = `<div style="background:var(--red-light);border:2px solid var(--red);border-radius:6px;padding:14px 16px;">
      <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--red);margin-bottom:4px;">⚠ Sunday Not Booked — This Breaks the System</div>
      <div style="font-size:15px;color:var(--ink-mid);margin-bottom:10px;">The slot is fixed infrastructure. Every week it doesn't run breaks compounding.</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="sun-dj-inline" placeholder="@djhandle" value="${djName}" style="width:140px;" oninput="document.getElementById('sun-dj').value=this.value">
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='outreach';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Outreach Sent</button>
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='confirmed';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Confirm</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>`;
  }
}

function editSundaySlot() {
  if (!S.sunday) S.sunday = {};
  S.sunday.status = 'outreach';
  save('sunday');
  renderSundayBlock();
  renderWeeklyRisk();
  updateSundayCard();
}

function clearSundaySlot() {
  S.sunday = {};
  const statusEl = document.getElementById('sun-status');
  const djEl = document.getElementById('sun-dj');
  if (statusEl) statusEl.value = '';
  if (djEl) djEl.value = '';
  save('sunday');
  renderSundayBlock();
  renderWeeklyRisk();
  updateSundayCard();
}

function renderWeeklyLever() {
  const el = document.getElementById('weekly-lever');
  if (!el) return;
  // Determine the one lever to show
  // Priority: if COGS data entered and > 30%, show COGS. Else show pricing.
  const cogsEl = document.getElementById('sc-cogs');
  const cogsVal = cogsEl ? parseInt(cogsEl.textContent) : NaN;
  if (!isNaN(cogsVal) && cogsVal > 30) {
    el.innerHTML = `<div class="alert al-c" style="margin-bottom:0;">
      <strong>This week's lever: COGS is ${cogsVal}% — fix before anything else.</strong>
      Check milk waste, espresso yield, and portioning. COGS → COGS Check tab.
    </div>`;
  } else {
    el.innerHTML = `<div class="alert al-a" style="margin-bottom:0;">
      <strong>This week's lever: Pricing.</strong>
      +$1 on top 5 items = +$300/wk, +$1,200/mo. Do it once. No announcement needed. → COGS Check tab.
    </div>`;
  }
}

function renderWeeklyRisk() {
  const el = document.getElementById('weekly-risk');
  if (!el) return;
  const wtd = S.logs.slice(0, 7).reduce((s, l) => s + l.rev, 0);
  const cogsEl = document.getElementById('sc-cogs');
  const cogs = cogsEl ? parseInt((cogsEl.textContent || '').replace('%', ''), 10) : NaN;
  const sundayOk = S.sunday && S.sunday.status === 'confirmed';

  const revRisk = wtd > 0 && wtd < 10500;
  const cogsRisk = !isNaN(cogs) && cogs > 30;
  let tone = 'al-g';
  let label = 'On Track';
  let msg = 'Revenue and margin conditions are within control range. Keep execution boring and repeatable.';

  if (revRisk && cogsRisk) {
    tone = 'al-c';
    label = 'Both At Risk';
    msg = 'Revenue is below floor and COGS is above target. Freeze new experiments. This week priority = margin repair + top-item conversion only.';
  } else if (revRisk) {
    tone = 'al-a';
    label = 'Revenue Risk';
    msg = 'Week pace is below $10.5k floor. Push proven bundles, keep top 5 in stock, and run Sunday execution clean.';
  } else if (cogsRisk) {
    tone = 'al-c';
    label = 'Margin Risk';
    msg = 'COGS is above 30%. Fix one source this week (portioning, pricing, or supplier) before adding growth tasks.';
  }

  const sundayLine = sundayOk
    ? '<span style="color:var(--green);">Sunday slot confirmed</span>'
    : '<span style="color:var(--red);">Sunday slot not confirmed</span>';
  const cogsLine = !isNaN(cogs) ? `${cogs}%` : 'not entered';

  el.innerHTML = `<div class="alert ${tone}" style="margin-bottom:0;">
    <strong>Weekly Risk State: ${label}</strong><br>
    <span style="font-size:14px;">WTD gross: $${wtd.toLocaleString()} · COGS: ${cogsLine} · ${sundayLine}</span><br>
    ${msg}
  </div>`;
  suggestTodayLever(label);
}

function renderCaptureStatus() {
  const el = document.getElementById('capture-status');
  if (!el) return;

  const recent = S.logs.slice(0, 7);
  const orders = recent.reduce((sum, x) => sum + (parseFloat(x.orders) || 0), 0);
  const loyalty = recent.reduce((sum, x) => sum + (parseFloat(x.loyalty) || 0), 0);

  if (!recent.length) {
    el.innerHTML = `<div class="alert al-n" style="margin-bottom:0;">
      <strong>Capture Status: No Data</strong><br>
      <span style="font-size:14px;">Log daily loyalty signups to track your primary KPI.</span>
    </div>`;
    return;
  }

  if (orders <= 0) {
    el.innerHTML = `<div class="alert al-n" style="margin-bottom:0;">
      <strong>Capture Status: Need Orders Data</strong><br>
      <span style="font-size:14px;">Fill orders + loyalty signups daily to compute capture trajectory.</span>
    </div>`;
    return;
  }

  const rate = (loyalty / orders) * 100;
  const targetLow = 25;
  const targetHigh = 40;
  let tone = 'al-c';
  let label = 'RED';
  let msg = 'Capture pace is below survival range. Use the register script every order.';

  if (rate >= targetLow && rate <= targetHigh) {
    tone = 'al-g';
    label = 'GREEN';
    msg = 'Capture pace is in target range. Hold this execution daily.';
  } else if (rate > targetHigh) {
    tone = 'al-g';
    label = 'GREEN+';
    msg = 'Capture pace is above target range. Keep process stable and repeatable.';
  } else if (rate >= 15) {
    tone = 'al-a';
    label = 'YELLOW';
    msg = 'Capture pace is improving but still below target. Tighten register ask consistency.';
  }

  el.innerHTML = `<div class="alert ${tone}" style="margin-bottom:0;">
    <strong>Capture Status: ${label}</strong><br>
    <span style="font-size:14px;">7-day loyalty capture ${rate.toFixed(1)}% · ${loyalty} signups / ${orders} orders · target ${targetLow}-${targetHigh}%</span><br>
    ${msg}
  </div>`;
}

function updateStatusCards() {
  updateWTD();
  renderSundayBlock();
  renderWeeklyLever();
  renderWeeklyRisk();
  renderCaptureStatus();
  renderCadenceLock();
  updatePaceLine();
}

function initSundaySlot() {
  const s = S.sunday;
  if (s.status) document.getElementById('sun-status').value = s.status;
  if (s.dj) document.getElementById('sun-dj').value = s.dj;
  updateSundayCard();
}

function saveSunday() {
  S.sunday = {
    status: document.getElementById('sun-status').value,
    dj: document.getElementById('sun-dj').value,
  };
  save('sunday');
  renderSundayBlock();
  renderWeeklyRisk();
  updateSundayCard();
  renderTodayExecutionState();
}

function updateSundayCard() {
  // Legacy — Sunday state now rendered via renderSundayBlock()
  renderSundayBlock();
}

// calcRev removed — quick calc card removed from Today page

// ── WEEK ──
function initWeek() {
  renderWeekChecks('week-checks-main');
  renderCalendar();
}

function resetWeekChecks() {
  weekChecks.forEach(c => delete S.checks[c.id]);
  save('checks');
  renderWeekChecks('week-checks-main');
  renderWeekChecks('week-checks-today');
}

const calEvs = { 10: 'dj', 14: 'ev', 24: 'dj', 31: 'dj' };
function renderCalendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  document.getElementById('cal-headers').innerHTML = days.map(d => `<div class="chdr">${d}</div>`).join('');
  let h = '';
  for (let i = 0; i < 5; i++) h += '<div class="cd empty"></div>'; // May 1 = Fri (index 5)
  for (let d = 1; d <= 31; d++) {
    const dow = (5 + d - 1) % 7;
    const open = dow >= 3;
    const ev = calEvs[d];
    const cls = ['cd', d === 3 ? 'today' : '', !open ? 'closed' : '', ev ? 'hasevent' : ''].filter(Boolean).join(' ');
    h += `<div class="${cls}"><div class="dn">${d}</div>${ev ? `<div class="ddot ${ev}"></div>` : ''}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = h;
}

// ── COGS ──
const cogsChecks = [
  { id: 'cg1', text: 'Audit milk usage this week', note: 'Track milk poured/wasted. If > 5% waste, switch to flat weekly order.' },
  { id: 'cg2', text: 'Check espresso yield', note: 'Lock grams in/out. Over-pulling wastes ~5–8% of coffee cost.' },
  { id: 'cg3', text: 'Verify top 5 item costs', note: 'Erik\'s Addiction, Açai, PB Bowl, Salmon Toast, Shroom Coffee.' },
  { id: 'cg4', text: 'Confirm supplier pricing unchanged', note: 'Every 60 days: compare Costco vs alternatives for high-volume items.' },
  { id: 'cg5', text: 'Check portioning consistency', note: 'Syrups, matcha, chai — pre-portion to stop over-portioning.' },
  { id: 'cg6', text: 'Calculate this week\'s COGS %', note: '(coffee + food + milk + other) ÷ revenue. Log the number.' },
];

function initCOGS() {
  const el = document.getElementById('cogs-checks');
  if (!el) return;
  el.innerHTML = cogsChecks.map(c => {
    const done = S.checks[c.id];
    return `<div class="ci" onclick="toggleCOGSCheck('${c.id}')">
      <div class="cb${done ? ' on' : ''}"></div>
      <div class="cb-body">
        <div class="cb-main${done ? ' done' : ''}">${c.text}</div>
        <div class="cb-note">${c.note}</div>
      </div>
    </div>`;
  }).join('');

  const c = S.ui.cogsCalculator || {};
  if (document.getElementById('cg-coffee')) document.getElementById('cg-coffee').value = c.coffee ?? '';
  if (document.getElementById('cg-food')) document.getElementById('cg-food').value = c.food ?? '';
  if (document.getElementById('cg-milk')) document.getElementById('cg-milk').value = c.milk ?? '';
  if (document.getElementById('cg-other')) document.getElementById('cg-other').value = c.other ?? '';
  if (document.getElementById('cg-rev')) document.getElementById('cg-rev').value = c.rev ?? '';

  const y = S.ui.coffeeYield || {};
  if (document.getElementById('cy-bag-cost') && y.bagCost !== undefined) document.getElementById('cy-bag-cost').value = y.bagCost;
  if (document.getElementById('cy-bag-lb') && y.bagLb !== undefined) document.getElementById('cy-bag-lb').value = y.bagLb;
  if (document.getElementById('cy-dose-g') && y.doseG !== undefined) document.getElementById('cy-dose-g').value = y.doseG;
  if (document.getElementById('cy-cb-oz-gal') && y.cbOzPerGal !== undefined) document.getElementById('cy-cb-oz-gal').value = y.cbOzPerGal;
  if (document.getElementById('cy-cup-oz') && y.cupOz !== undefined) document.getElementById('cy-cup-oz').value = y.cupOz;

  calcCOGS();
  calcCoffeeYield();
}

function toggleCOGSCheck(id) {
  S.checks[id] = !S.checks[id];
  save('checks');
  initCOGS();
}

function calcCOGS() {
  const coffee = parseFloat(document.getElementById('cg-coffee').value) || 0;
  const food = parseFloat(document.getElementById('cg-food').value) || 0;
  const milk = parseFloat(document.getElementById('cg-milk').value) || 0;
  const other = parseFloat(document.getElementById('cg-other').value) || 0;
  const rev = parseFloat(document.getElementById('cg-rev').value) || 0;
  S.ui.cogsCalculator = {
    coffee: document.getElementById('cg-coffee').value,
    food: document.getElementById('cg-food').value,
    milk: document.getElementById('cg-milk').value,
    other: document.getElementById('cg-other').value,
    rev: document.getElementById('cg-rev').value,
  };
  save('app');
  const total = coffee + food + milk + other;
  if (!rev || !total) return;
  const pct = Math.round(total / rev * 100);
  const color = pct <= 28 ? 'var(--green)' : pct <= 35 ? 'var(--amber)' : 'var(--red)';
  const status = pct <= 28 ? '✓ On target' : pct <= 35 ? '⚠ Above target — identify and fix' : '✗ Critical — fix before next week';
  document.getElementById('cogs-result').innerHTML =
    `Total COGS: ${total.toFixed(2)} / Revenue: ${rev.toFixed(2)}<br>
     COGS %: <strong style="color:${color};font-size:15px;">${pct}%</strong><br>
     <span style="color:${color};">${status}</span>`;
  const sc = document.getElementById('sc-cogs');
  const card = document.getElementById('sc-cogs-card');
  if (sc) sc.textContent = pct + '%';
  if (card) card.className = 's-card ' + (pct <= 28 ? 'green' : pct <= 35 ? 'amber' : 'red');
  renderWeeklyLever();
  renderWeeklyRisk();
}

function calcCoffeeYield() {
  const bagCost = parseFloat(document.getElementById('cy-bag-cost')?.value) || 0;
  const bagLb = parseFloat(document.getElementById('cy-bag-lb')?.value) || 0;
  const doseG = parseFloat(document.getElementById('cy-dose-g')?.value) || 0;
  const cbOzPerGal = parseFloat(document.getElementById('cy-cb-oz-gal')?.value) || 0;
  const cupOz = parseFloat(document.getElementById('cy-cup-oz')?.value) || 0;
  S.ui.coffeeYield = {
    bagCost: document.getElementById('cy-bag-cost')?.value ?? '',
    bagLb: document.getElementById('cy-bag-lb')?.value ?? '',
    doseG: document.getElementById('cy-dose-g')?.value ?? '',
    cbOzPerGal: document.getElementById('cy-cb-oz-gal')?.value ?? '',
    cupOz: document.getElementById('cy-cup-oz')?.value ?? '',
  };
  save('app');
  const out = document.getElementById('coffee-yield-out');
  if (!out) return;
  if (!bagCost || !bagLb || !doseG || !cbOzPerGal || !cupOz) {
    out.textContent = 'Enter all values to calculate coffee yield costs.';
    return;
  }
  const bagOz = bagLb * 16;
  const costPerOz = bagCost / bagOz;
  const shotOz = doseG / 28.3495;
  const shotCost = shotOz * costPerOz;
  const coldBrewGalCost = cbOzPerGal * costPerOz;
  const coldBrewCupCost = coldBrewGalCost * (cupOz / 128);
  out.innerHTML = `Bean landed cost: <strong>${costPerOz.toFixed(3)}/oz</strong> · Espresso shot (@${doseG}g): <strong>${shotCost.toFixed(2)}</strong><br>
  Cold brew bean cost: <strong>${coldBrewGalCost.toFixed(2)}/gal</strong> · <strong>${coldBrewCupCost.toFixed(2)}</strong> per ${cupOz}oz cup`;
}

// ── DJs ──
const stCls = { Prospect: 'bn', Contacted: 'ba', Confirmed: 'bg', Done: 'bc' };
let djEditIndex = -1;

function resetDJForm() {
  ['dj-name', 'dj-genre', 'dj-contact', 'dj-lastplayed'].forEach(id => document.getElementById(id).value = '');
  const st = document.getElementById('dj-status');
  if (st) st.value = 'Prospect';
  const btn = document.querySelector('#page-djs .btn.btn-sm');
  if (btn) btn.textContent = 'Add to roster';
  djEditIndex = -1;
}

function currentDJForm() {
  return {
    name: document.getElementById('dj-name').value.trim(),
    genre: document.getElementById('dj-genre').value.trim(),
    contact: document.getElementById('dj-contact').value.trim(),
    status: document.getElementById('dj-status').value,
    last: document.getElementById('dj-lastplayed').value.trim(),
  };
}

function addDJ() {
  const next = currentDJForm();
  if (!next.name) return;
  if (djEditIndex >= 0 && S.djs[djEditIndex]) {
    S.djs[djEditIndex] = next;
  } else {
    S.djs.push(next);
  }
  save('djs');
  resetDJForm();
  renderDJs();
}

function editDJ(i) {
  const d = S.djs[i];
  if (!d) return;
  djEditIndex = i;
  document.getElementById('dj-name').value = d.name || '';
  document.getElementById('dj-genre').value = d.genre || '';
  document.getElementById('dj-contact').value = d.contact || '';
  document.getElementById('dj-status').value = d.status || 'Prospect';
  document.getElementById('dj-lastplayed').value = d.last || '';
  const btn = document.querySelector('#page-djs .btn.btn-sm');
  if (btn) btn.textContent = 'Confirm DJ';
  document.getElementById('dj-name')?.focus();
}

function renderDJs() {
  const tb = document.getElementById('dj-tbody');
  if (!tb) return;
  if (!S.djs.length) { tb.innerHTML = '<tr><td colspan="6" style="color:var(--ink-light);font-style:italic;padding:10px;">No DJs added yet. Build your roster — aim for 6–8 rotating acts.</td></tr>'; return; }
  tb.innerHTML = S.djs.map((d, i) =>
    `<tr>
      <td style="font-weight:500;">${d.name || '—'}</td>
      <td style="color:var(--ink-mid);">${d.genre || '—'}</td>
      <td style="color:var(--ink-light);">${d.contact || '—'}</td>
      <td><span class="badge ${stCls[d.status] || 'bn'}">${d.status || 'Prospect'}</span></td>
      <td style="color:var(--ink-light);">${d.last || '—'}</td>
      <td style="white-space:nowrap;">
        <span onclick="editDJ(${i})" style="cursor:pointer;color:var(--ink-light);font-size:13px;margin-right:8px;">Edit</span>
        <span onclick="removeDJ(${i})" style="cursor:pointer;color:var(--ink-light);font-size:14px;">×</span>
      </td>
    </tr>`).join('');
}

function removeDJ(i) {
  if (i < 0 || i >= S.djs.length) return;
  S.djs.splice(i, 1);
  if (djEditIndex === i) resetDJForm();
  else if (djEditIndex > i) djEditIndex -= 1;
  save('djs');
  renderDJs();
}

// ── Anchors ──
function addAnchor() {
  const biz = document.getElementById('an-biz').value.trim();
  if (!biz) return;
  S.anchors.push({ biz, type: document.getElementById('an-type').value.trim(), contact: document.getElementById('an-contact').value.trim(), last: document.getElementById('an-last').value.trim(), deal: document.getElementById('an-deal').value.trim() });
  save('anchors');
  ['an-biz', 'an-type', 'an-contact', 'an-last', 'an-deal'].forEach(id => document.getElementById(id).value = '');
  renderAnchors();
}
function renderAnchors() {
  const tb = document.getElementById('anchor-tbody');
  if (!tb) return;
  if (!S.anchors.length) { tb.innerHTML = '<tr><td colspan="6" style="color:var(--ink-light);font-style:italic;padding:10px;">No nodes added yet. Identify 6–8 businesses within a 10-min walk.</td></tr>'; return; }
  tb.innerHTML = S.anchors.map((a, i) =>
    `<tr>
      <td style="font-weight:500;">${a.biz}</td>
      <td style="color:var(--ink-mid);">${a.type || '—'}</td>
      <td style="color:var(--ink-light);">${a.contact || '—'}</td>
      <td style="color:var(--ink-light);font-size:14px;max-width:180px;">${a.deal || '—'}</td>
      <td style="color:var(--ink-light);">${a.last || '—'}</td>
      <td><span onclick="removeAnchor(${i})" style="cursor:pointer;color:var(--ink-light);font-size:14px;">×</span></td>
    </tr>`).join('');
}
function removeAnchor(i) { S.anchors.splice(i, 1); save('anchors'); renderAnchors(); }

// ── P&L ──
function initPnl() {
  renderLogHist('pnl-log-hist');
}

function calcBE() {
  const rev = parseFloat(document.getElementById('be-rev').value);
  if (isNaN(rev)) return;
  const staffRate = parseFloat(document.getElementById('be-rate')?.value) || 17;
  const staffHrs = parseFloat(document.getElementById('be-staff-hrs')?.value) || 7;
  const openDays = parseFloat(document.getElementById('be-days')?.value) || 6.2;
  const cogs = rev * 0.30;
  const staffing = staffRate * staffHrs * openDays;
  const staffingPct = rev > 0 ? (staffing / rev * 100) : 0;
  const net = rev - cogs - staffing - FIXED_COSTS;
  const grossFor4k = (NET_TARGET + FIXED_COSTS + staffing) / (1 - COGS_PCT);
  const pct = Math.min(100, Math.round(rev / GROSS_TARGET * 100));
  const color = net > 0 ? 'var(--green)' : 'var(--accent)';
  const status = net > NET_TARGET ? '✓ $4k net reached' : net > 0 ? '✓ profitable' : '✗ below break-even';
  document.getElementById('be-out').innerHTML =
    `$${rev.toLocaleString()}/wk gross · −$${Math.round(cogs).toLocaleString()} COGS · −$${Math.round(staffing).toLocaleString()} staffing (${staffingPct.toFixed(1)}%) · −$${FIXED_COSTS} fixed<br>
     Est. net: <strong style="color:${color};">$${Math.round(net).toLocaleString()}/wk</strong> · ${status}<br>
     $${Math.round(grossFor4k).toLocaleString()} gross needed for $4k net at current staffing schedule`;
  const bar = document.getElementById('be-bar');
  if (bar) { bar.style.width = pct + '%'; bar.className = 'prog-f ' + (pct >= 80 ? 'g' : pct >= 50 ? 'w' : 'd'); }
}

// ── Inventory ──
// ── INVENTORY ──
// unitCost = cost per unit (the "unit" column)
// costNote = where the cost comes from
const invData = [
  // ── CRITICAL — menu killers if out ──
  { loc:'FREEZER', item:'Frozen Coconut Base', src:'Make own (Costco milk)', unit:'batch', have:'', par:'3', critical:true, unitCost:0.99, costNote:'1 can coconut milk + agave = ~$0.99/batch (12oz). Switch from Sprouts ice cream = 87% savings.' },
  { loc:'FRIDGE', item:'Avocado (Hass)', src:'Restaurant Depot', unit:'each', have:'', par:'20', critical:true, unitCost:0.86, costNote:'$42.99 / 50 avocados. Used in 4 menu items. Never below 12.' },
  { loc:'TOAST', item:'Sourdough Loaf', src:'Zak The Baker', unit:'loaf', have:'', par:'3', critical:true, unitCost:8.00, costNote:'Zak The Baker multigrain large $8/loaf. ~16 slices -> $1.00/2 slices on toasts.' },
  { loc:'TOAST', item:'Banana Bread (large)', src:'Zak The Baker', unit:'loaf', have:'', par:'2', critical:false, unitCost:15.40, costNote:'Zak The Baker wholesale $15.40/large. Vegan Banana Bread menu COGS - confirm slices per loaf for per-serving math.' },
  { loc:'FRIDGE', item:'Smoked Salmon (8oz x2)', src:'Costco', unit:'pkg', have:'', par:'3', critical:true, unitCost:26.39, costNote:'$26.39/pkg (16oz). $1.65/oz. Most expensive ingredient. Watch portions — 2oz per toast.' },
  { loc:'BAR', item:'Oat Milk (32oz x6)', src:'Costco', unit:'case', have:'', par:'2', critical:true, unitCost:11.54, costNote:'$11.54/case (192oz). $0.06/oz. Core of all smoothies and lattes.' },
  { loc:'FRIDGE', item:'Coconut Milk (32oz x6)', src:'Costco', unit:'case', have:'', par:'1', critical:true, unitCost:12.09, costNote:'$12.09/case (192oz). $0.063/oz. Breechay\'s Special base + coconut topping.' },

  // ── PROTEINS / DAIRY ──
  { loc:'FRIDGE', item:'Milk – Whole (1 gal)', src:'Costco', unit:'gal', have:'', par:'2', critical:false, unitCost:3.56, costNote:'$3.56/gal (128oz). $0.028/oz. Cheapest dairy on menu.' },
  { loc:'FRIDGE', item:'Hard-Boiled Eggs (16ct x2)', src:'Costco', unit:'pack', have:'', par:'2', critical:false, unitCost:15.39, costNote:'$15.39 / 32 eggs = $0.48/egg. Egg toast uses 2 eggs = $0.96 food cost.' },
  { loc:'MAIN FREEZER', item:'Frozen Chicken', src:'Costco', unit:'pkg', have:'', par:'2', critical:false, unitCost:12.00, costNote:'Est $12/pkg (Costco rotisserie or breast). Confirm price.' },

  // ── NUT BUTTERS ──
  { loc:'KITCHEN', item:'Almond Butter (27oz)', src:'Costco', unit:'jar', have:'', par:'2', critical:false, unitCost:9.56, costNote:'$9.56/27oz = $0.354/oz. Used in Erik\'s Addiction. 1oz per serving = $0.35.' },
  { loc:'KITCHEN', item:'Peanut Butter (28oz x2)', src:'Costco', unit:'pack', have:'', par:'2', critical:false, unitCost:10.99, costNote:'$10.99 / 56oz = $0.196/oz. Used in Brice\'s PB Bowl and Açaí Bowl.' },

  // ── PRODUCE ──
  { loc:'PRODUCE', item:'Banana (3lb bunch)', src:'Costco', unit:'bunch', have:'', par:'4', critical:false, unitCost:2.19, costNote:'$2.19 / ~9 bananas = $0.24/banana. Used in 3 items. High turnover — check daily.' },
  { loc:'PRODUCE', item:'Strawberries (2lb)', src:'Costco', unit:'pack', have:'', par:'2', critical:false, unitCost:3.84, costNote:'$3.84 / 32oz = $0.12/oz. Açaí Bowl topping, ~2oz per bowl.' },
  { loc:'PRODUCE', item:'Avocado – Backup', src:'Costco / local', unit:'each', have:'', par:'6', critical:false, unitCost:1.20, costNote:'Emergency backup source. Higher cost, use only if Restaurant Depot stock runs out.' },
  { loc:'PRODUCE', item:'Arugula (10oz)', src:'Costco', unit:'bag', have:'', par:'2', critical:false, unitCost:5.49, costNote:'$5.49/10oz = $0.549/oz. Salmon toast uses 1oz per serving.' },
  { loc:'PRODUCE', item:'Baby Spinach (1lb)', src:'Costco', unit:'bag', have:'', par:'2', critical:false, unitCost:5.49, costNote:'$5.49/16oz = $0.343/oz. Chicken toast uses 1oz per serving.' },
  { loc:'PRODUCE', item:'Watermelon (mini, 2ct)', src:'Costco', unit:'pack', have:'', par:'2', critical:false, unitCost:8.79, costNote:'$8.79 / 2 melons. ~8 juice servings per melon = $1.10/serving. Good margin item.' },
  { loc:'PRODUCE', item:'Ginger (30lb)', src:'Restaurant Depot', unit:'box', have:'', par:'1', critical:false, unitCost:39.99, costNote:'$39.99 / 480oz = $0.083/oz. Healer Shot uses 0.5oz = $0.04. Lasts weeks.' },
  { loc:'PRODUCE', item:'Lemon', src:'Costco', unit:'each', have:'', par:'12', critical:false, unitCost:0.25, costNote:'Est $0.25/lemon. Healer shot uses 1/4 lemon = $0.06.' },

  // ── PANTRY / DRY ──
  { loc:'PANTRY', item:'Agave (36oz x2)', src:'Costco', unit:'pack', have:'', par:'1', critical:false, unitCost:9.89, costNote:'$9.89 / 72oz = $0.137/oz. Used in frozen coconut base + Breechay\'s.' },
  { loc:'PANTRY', item:'Matcha Powder Ceremonial (1lb)', src:'Bulk supplier', unit:'bag', have:'', par:'1', critical:false, unitCost:76.50, costNote:'$101.99 after THANKYOU20 discount = ~$76.50. $0.169/g. 2g per serving = $0.34. Breechay\'s + Matcha Latte.' },
  { loc:'PANTRY', item:'Coconut Shreds Fine (2lb)', src:'Bulk supplier', unit:'bag', have:'', par:'1', critical:false, unitCost:13.49, costNote:'$17.99 after discount = ~$13.49. $0.42/oz. Topping use only — not for blending base.' },
  { loc:'PANTRY', item:'Honey (24oz x3)', src:'Costco', unit:'pack', have:'', par:'1', critical:false, unitCost:21.55, costNote:'$21.55 / 72oz = $0.299/oz. Healer Shot uses 0.5oz = $0.15.' },
  { loc:'PANTRY', item:'Maple Syrup', src:'Costco', unit:'bottle', have:'', par:'2', critical:false, unitCost:8.00, costNote:'Est $8/bottle. Confirm price.' },
  { loc:'PANTRY', item:'Olive Oil', src:'Costco', unit:'bottle', have:'', par:'2', critical:false, unitCost:12.00, costNote:'Est $12/bottle. Egg toast uses ~0.5oz per serving.' },
  { loc:'PANTRY', item:'Balsamic Vinegar', src:'Costco', unit:'bottle', have:'', par:'2', critical:false, unitCost:8.00, costNote:'Est $8/bottle. Chicken toast uses ~0.5oz per serving.' },
  { loc:'PANTRY', item:'Coconut Oil', src:'Costco', unit:'jug', have:'', par:'1', critical:false, unitCost:14.00, costNote:'Est $14/jug. Shroom Coffee uses 1tsp = ~$0.03.' },
  { loc:'PANTRY', item:'GF Granola (Barely Sweet)', src:'BOLA Granola', unit:'20lb bag', have:'', par:'1', critical:false, unitCost:120.00, costNote:'Invoice #11008 (04/06/2026): 20lb bulk bag at $120. Cost = $6/lb = $0.375/oz. Used in Açaí Bowl + PB Bowl (~1oz/serving).' },
  { loc:'PANTRY', item:'Chia Seeds', src:'Costco/Amazon', unit:'bag', have:'', par:'1', critical:false, unitCost:9.00, costNote:'Est $9/bag. Açaí Bowl uses 1 tbsp = ~$0.05.' },
  { loc:'PANTRY', item:'Cacao Nibs', src:'Amazon/bulk', unit:'bag', have:'', par:'1', critical:false, unitCost:12.00, costNote:'Est $12/lb. Erik\'s uses ~0.3oz = $0.22. Açaí Bowl uses ~0.25oz = $0.19.' },

  // ── COFFEE ──
  { loc:'BAR', item:'Coffee Beans (Perl\'a)', src:'Perl\'a', unit:'5lb bag', have:'', par:'2', critical:true, unitCost:68.00, costNote:'Invoice #14611 (04/01/2026): 6 bags at $63.75 + $25.50 shipping = $408 total. Landed cost ~ $68/bag (5lb, 80oz) = $0.85/oz. Finalize espresso and cold brew yield specs in ops.' },
  { loc:'BAR', item:'Espresso Powder (Amazon)', src:'Amazon', unit:'container', have:'', par:'1', critical:false, unitCost:19.39, costNote:'$19.39 / 8oz = $2.42/oz = $1.21/double shot. FOR SMOOTHIE ADD-ONS ONLY. Consider switching to Perl\'a beans.' },
  { loc:'BAR', item:'Mushroom Blend (Live Ultimate Shrooms)', src:'Live Ultimate Shrooms', unit:'pouch', have:'', par:'2', critical:false, unitCost:33.00, costNote:'Working cost from owner: $33 per pouch (typically order 10). Need servings per pouch to convert to per-drink cost exactly.' },
  { loc:'FREEZER', item:'Açaí Base (Nativo Puro)', src:'Nativo / Amazonie Ventures', unit:'case (8kg)', have:'', par:'2', critical:true, unitCost:73.00, costNote:'Invoice #32685 (01/09/2026). $73/case = 80×100g packs (~$0.91/pack). Pure pulp — Cost Cards use ~$1.03 per ~4oz wt serving; adjust if recipe uses 2 packs.' },
  { loc:'BAR', item:'Protein Powder (Pumpkin Seed)', src:'Amazon', unit:'bag', have:'', par:'1', critical:false, unitCost:25.99, costNote:'$25.99/16oz = $1.62/oz. Add-on +$2. At 1oz per serving: $1.62 cost, $0.38 margin. Borderline — consider raising add-on to $3.' },
  { loc:'BAR', item:'Vanilla Syrup (Torani 1L)', src:'Amazon', unit:'bottle', have:'', par:'2', critical:false, unitCost:12.99, costNote:'$12.99/33.8oz = $0.38/oz. 1 pump = ~$0.10.' },

  // ── SUPPLIES (non-food, tracked for overhead) ──
  { loc:'BAR', item:'Bamboo Straws (100pk)', src:'Amazon', unit:'pack', have:'', par:'2', critical:false, unitCost:20.99, costNote:'$20.99/100 = $0.21/straw. Include in per-item supply cost.' },
  { loc:'BAR', item:'Take-Out Containers (450ct)', src:'WebstaurantStore', unit:'case', have:'', par:'1', critical:false, unitCost:55.99, costNote:'$55.99/450 = $0.12 each. Black folded containers.' },
  { loc:'BAR', item:'Cocktail Napkins Black (1000ct)', src:'WebstaurantStore', unit:'case', have:'', par:'1', critical:false, unitCost:16.99, costNote:'$16.99/1000 = $0.017 each.' },
  { loc:'BAR', item:'Bamboo Forks (100pk)', src:'WebstaurantStore', unit:'pack', have:'', par:'3', critical:false, unitCost:9.99, costNote:'$9.99/100 = $0.10 each.' },
  { loc:'SUPPLIES', item:'Paper Towels (12-roll)', src:'Costco', unit:'pack', have:'', par:'1', critical:false, unitCost:22.87, costNote:'$22.87/12 rolls. Operational supply — not in COGS.' },
  { loc:'SUPPLIES', item:'Trash Bags Kitchen 13gal', src:'Amazon', unit:'box', have:'', par:'1', critical:false, unitCost:19.93, costNote:'$19.93/110 bags. Operational.' },
  { loc:'R.ROOM', item:'Toilet Paper', src:'Costco', unit:'roll', have:'', par:'12', critical:false, unitCost:0.80, costNote:'Est $0.80/roll from Costco pack.' },
  { loc:'R.ROOM', item:'Hand Soap', src:'Amazon', unit:'bottle', have:'', par:'2', critical:false, unitCost:4.00, costNote:'Est $4/bottle.' },
];

// Items that count toward COGS (food/bev only, not supplies)
const cogsItems = invData.filter(i => !['SUPPLIES','R.ROOM'].includes(i.loc));

function renderInv() {
  const tb = document.getElementById('inv-tbody');
  if (!tb) return;
  const invHave = S.ui.inventoryHave;
  if (Array.isArray(invHave) && invHave.length === invData.length) {
    invData.forEach((r, i) => { r.have = invHave[i] ?? r.have; });
  }

  // Group by location
  const groups = {};
  invData.forEach((r, i) => {
    if (!groups[r.loc]) groups[r.loc] = [];
    groups[r.loc].push({ ...r, idx: i });
  });

  let html = '';
  Object.keys(groups).forEach(loc => {
    html += `<tr><td colspan="9" style="background:var(--surface);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-light);padding:5px 8px;font-weight:500;">${loc}</td></tr>`;
    groups[loc].forEach(r => {
      const i = r.idx;
      const hv = parseFloat(r.have), pv = parseFloat(r.par);
      const hasHave = r.have !== '' && !isNaN(hv);
      const isLow = hasHave && hv < pv;
      const isOk = hasHave && hv >= pv;
      let bc = 'bn', bt = '—';
      if (isLow) { bc = 'br'; bt = 'Order'; }
      else if (isOk) { bc = 'bg'; bt = 'OK'; }

      const costDisplay = r.unitCost > 0
        ? `<span style="font-size:13px;color:var(--ink-mid);">$${r.unitCost.toFixed(2)}</span>`
        : `<span style="font-size:13px;color:var(--amber);">TBD</span>`;

      // Stock value
      let stockVal = '';
      if (r.unitCost > 0 && hasHave) {
        const val = (hv * r.unitCost).toFixed(2);
        stockVal = `<span style="font-size:13px;color:var(--ink-light);">$${val}</span>`;
      }

      // PAR value
      const parVal = r.unitCost > 0
        ? `<span style="font-size:12px;color:var(--ink-light);">$${(pv * r.unitCost).toFixed(2)}</span>`
        : '';

      const item = (r.item || '').toLowerCase();
      let impact = 'Secondary';
      if (item.includes('avocado')) impact = '4 items';
      else if (item.includes('frozen coconut')) impact = '3 items';
      else if (item.includes('oat milk')) impact = '6+ drinks';
      else if (item.includes('sourdough')) impact = 'All toasts';
      else if (item.includes('salmon')) impact = '1 premium';
      else if (item.includes('açaí base')) impact = 'Açaí bowl';
      else if (item.includes('coffee beans')) impact = 'All coffee';
      const impactColor = impact === 'Secondary' ? 'var(--ink-light)' : 'var(--ink)';

      html += `<tr${r.critical ? ' style="background:rgba(196,89,58,0.03);"' : ''}
        title="${r.costNote || ''}"
        style="cursor:default;">
        <td style="font-weight:${r.critical?'500':'400'};">
          ${r.item}${r.critical ? ' <span style="color:var(--accent);font-size:12px;">★</span>' : ''}
          ${r.unitCost === 0 ? ' <span style="font-size:12px;color:var(--amber);">⚠ cost TBD</span>' : ''}
        </td>
        <td style="color:var(--ink-light);font-size:14px;">${r.src}</td>
        <td style="color:var(--ink-light);">${r.unit}</td>
        <td>${costDisplay}</td>
        <td><input type="text" value="${r.have}" placeholder="—"
          style="width:42px;padding:2px 5px;font-size:14px;"
          oninput="onInventoryHaveInput(${i}, this.value)"></td>
        <td style="color:var(--ink-mid);">${r.par}<br>${parVal}</td>
        <td style="font-size:13px;color:${impactColor};">${impact}</td>
        <td>${stockVal}</td>
        <td><span class="badge ${bc}">${bt}</span></td>
      </tr>`;
    });
  });
  tb.innerHTML = html;
  updateInvSummary();
}

function updateInvSummary() {
  // Total current stock value (food items with known costs + quantities)
  let totalStockValue = 0;
  let pendingCount = 0;
  let lowCritical = [];
  invData.forEach(r => {
    const hv = parseFloat(r.have);
    if (!isNaN(hv) && r.unitCost > 0) {
      totalStockValue += hv * r.unitCost;
    }
    if (r.unitCost === 0) pendingCount++;
    if (r.critical && r.have !== '' && !isNaN(hv) && hv < parseFloat(r.par)) {
      lowCritical.push(r.item);
    }
  });

  const el = document.getElementById('inv-summary');
  if (!el) return;

  const critAlert = lowCritical.length > 0
    ? `<div class="alert al-c" style="margin-bottom:8px;"><strong>⚠ Critical items low:</strong> ${lowCritical.join(', ')} — order today.</div>`
    : '';

  el.innerHTML = `
    ${critAlert}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
      <div class="metric">
        <div class="m-lbl">Stock on hand value</div>
        <div class="m-val">$${totalStockValue.toFixed(0)}</div>
        <div class="m-sub">items with known costs + qty</div>
      </div>
      <div class="metric">
        <div class="m-lbl">Costs pending</div>
        <div class="m-val" style="color:var(--amber);">${pendingCount}</div>
        <div class="m-sub">cost detail pending (mushroom servings, espresso dose/cold brew yield)</div>
      </div>
      <div class="metric">
        <div class="m-lbl">Critical items low</div>
        <div class="m-val" style="color:${lowCritical.length > 0 ? 'var(--red)' : 'var(--green)'};">${lowCritical.length}</div>
        <div class="m-sub">${lowCritical.length > 0 ? lowCritical[0] + (lowCritical.length > 1 ? ' +' + (lowCritical.length-1) : '') : 'all critical items stocked'}</div>
      </div>
    </div>
  `;
}


function calcWeeklySpend() {
  const costco = parseFloat(document.getElementById('spend-costco').value) || 0;
  const depot  = parseFloat(document.getElementById('spend-depot').value)  || 0;
  const other  = parseFloat(document.getElementById('spend-other').value)  || 0;
  const amazon = parseFloat(document.getElementById('spend-amazon').value) || 0;
  const perla  = parseFloat(document.getElementById('spend-perla').value)  || 0;
  const rev    = parseFloat(document.getElementById('spend-rev').value)    || 0;
  S.ui.inventorySpend = {
    costco: document.getElementById('spend-costco').value,
    depot: document.getElementById('spend-depot').value,
    other: document.getElementById('spend-other').value,
    amazon: document.getElementById('spend-amazon').value,
    perla: document.getElementById('spend-perla').value,
    rev: document.getElementById('spend-rev').value,
  };
  save('app');
  const totalSpend = costco + depot + other + amazon + perla;
  if (!totalSpend) return;
  const suppliesEst = amazon * 0.3;
  const foodSpend = totalSpend - suppliesEst;
  const cogsPct = rev > 0 ? (foodSpend / rev * 100) : 0;
  const color = cogsPct <= 30 ? 'var(--green)' : cogsPct <= 40 ? 'var(--amber)' : 'var(--red)';
  const status = cogsPct <= 30 ? '✓ On target' : cogsPct <= 40 ? '⚠ Above target — find the source' : '✗ Critical — fix before next week';
  document.getElementById('spend-result').innerHTML =
    `Total spend: <strong>${totalSpend.toFixed(2)}</strong> · Est. supplies (non-food): ~${suppliesEst.toFixed(2)} · Food/bev COGS: <strong>${foodSpend.toFixed(2)}</strong><br>` +
    (rev > 0
      ? `COGS %: <strong style="color:${color};font-size:14px;">${cogsPct.toFixed(1)}%</strong> · <span style="color:${color};">${status}</span><br><span style="font-size:13px;color:var(--ink-light);">Copy this into COGS Check tab on Monday. Target: ≤30%.</span>`
      : `<span style="color:var(--ink-light);">Enter this week's gross revenue to calculate COGS %.</span>`);
}

// ── Open/Close ──
const openList = [
  { id:'o1', text:'Equipment on — espresso, blenders', note:'' },
  { id:'o2', text:'Ice filled', note:'' },
  { id:'o3', text:'Frozen coconut prepped', note:"Erik's, Breechay's Special, PB Bowl" },
  { id:'o4', text:'Avocado checked / mashed', note:'3 toast items use avocado' },
  { id:'o5', text:'Sourdough sliced', note:'' },
  { id:'o6', text:'Granola portioned', note:'Açai Bowl + PB Bowl' },
  { id:'o7', text:'Square POS + loyalty prompt on', note:'' },
  { id:'o8', text:'Patio set if Sa/Su', note:'Clean, chairs out, sound on' },
];
const closeList = [
  { id:'c1', text:"Log today's revenue", note:'In console → Today tab' },
  { id:'c2', text:'Blenders cleaned', note:'' },
  { id:'c3', text:'Espresso back-flush', note:'Daily' },
  { id:'c4', text:'Fridge check', note:'Avocado, coconut, milk for tomorrow' },
  { id:'c5', text:'Surfaces + floor', note:'' },
  { id:'c6', text:'Trash out if full', note:'' },
  { id:'c7', text:'Lock patio + doors', note:'' },
];

function initOps() {
  const render = (list, target) => {
    document.getElementById(target).innerHTML = list.map(c => {
      const done = S.checks[c.id];
      return `<div class="ci" onclick="toggleOps('${c.id}')">
        <div class="cb${done ? ' on' : ''}"></div>
        <div class="cb-body">
          <div class="cb-main${done ? ' done' : ''}">${c.text}</div>
          ${c.note ? `<div class="cb-note">${c.note}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  };
  render(openList, 'open-wrap');
  render(closeList, 'close-wrap');
  renderSavedNotes();
applyPersistedInventorySpend();
calcWeeklySpend();
}

function toggleOps(id) {
  S.checks[id] = !S.checks[id];
  save('checks');
  initOps();
}

function resetOps() {
  [...openList, ...closeList].forEach(c => delete S.checks[c.id]);
  save('checks');
  initOps();
}

function saveNote() {
  const txt = document.getElementById('ops-notes').value.trim();
  if (!txt) return;
  const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  S.notes.unshift({ date: d, text: txt });
  if (S.notes.length > 10) S.notes.pop();
  save('notes');
  document.getElementById('ops-notes').value = '';
  renderSavedNotes();
}

function renderSavedNotes() {
  const el = document.getElementById('ops-notes-saved');
  if (!el || !S.notes.length) return;
  el.innerHTML = S.notes.slice(0, 5).map(n =>
    `<div style="padding:5px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:12px;color:var(--ink-light);">${n.date}</div>
      <div style="font-size:14px;color:var(--ink);margin-top:1px;">${n.text}</div>
    </div>`).join('');
}

// ── Init ──
initStatus();
initToday();
renderDJs();
renderAnchors();
renderInv();
renderSavedNotes();
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') maybeAutoSquareToday();
  });
}

// ── WEEKLY REVIEW ──
function initReview() {
  renderReviewHist();
  renderPaceTracker();
  renderMonthlyHist();
}

function saveReview() {
  const r = {
    week: document.getElementById('rv-week').value.trim(),
    gross: document.getElementById('rv-gross').value,
    orders: document.getElementById('rv-orders').value,
    ticket: document.getElementById('rv-ticket').value,
    cogs: document.getElementById('rv-cogs').value,
    sms: document.getElementById('rv-sms').value,
    sunday: document.getElementById('rv-sunday').value,
    loyaltyNew: document.getElementById('rv-loyalty-new').value,
    loyaltyRate: document.getElementById('rv-loyalty-rate').value,
    reviewsNew: document.getElementById('rv-reviews-new').value,
    srcIg: document.getElementById('rv-src-ig').value,
    srcGoogle: document.getElementById('rv-src-google').value,
    srcWalk: document.getElementById('rv-src-walk').value,
    srcRef: document.getElementById('rv-src-ref').value,
    return7: document.getElementById('rv-return7').value,
    firsttime: document.getElementById('rv-firsttime').value,
    return7pct: document.getElementById('rv-return7pct').value,
    loopFri: document.getElementById('rv-loop-friday').checked,
    loopSun: document.getElementById('rv-loop-sunday').checked,
    loopMon: document.getElementById('rv-loop-monday').checked,
    contentPlanned: document.getElementById('rv-content-planned').checked,
    contentShot: document.getElementById('rv-content-shot').checked,
    contentPosted: document.getElementById('rv-content-posted').checked,
    q1: document.getElementById('rv-q1').value,
    q2: document.getElementById('rv-q2').value,
    q3: document.getElementById('rv-q3').value,
    q4: document.getElementById('rv-q4').value.trim(),
    q5: document.getElementById('rv-q5').value.trim(),
    q6: document.getElementById('rv-q6').value.trim(),
    saved: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
    savedAt: Date.now()
  };
  if (!r.week) return alert('Add the week date first.');
  // Replace if same week exists
  const idx = S.reviews.findIndex(x => x.week === r.week);
  if (idx >= 0) S.reviews[idx] = r; else S.reviews.unshift(r);
  if (S.reviews.length > 52) S.reviews.pop();
  save('reviews');
  renderReviewHist();
  renderPaceTracker();
  renderCadenceLock();
  // Clear form
  ['rv-week','rv-gross','rv-orders','rv-ticket','rv-cogs','rv-sms','rv-sunday','rv-loyalty-new','rv-loyalty-rate','rv-reviews-new','rv-src-ig','rv-src-google','rv-src-walk','rv-src-ref','rv-return7','rv-firsttime','rv-return7pct','rv-q4','rv-q5','rv-q6'].forEach(id => document.getElementById(id).value = '');
  ['rv-q1','rv-q2','rv-q3'].forEach(id => document.getElementById(id).value = '');
  ['rv-content-planned','rv-content-shot','rv-content-posted','rv-loop-friday','rv-loop-sunday','rv-loop-monday'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
}

function saveMonthly() {
  const m = {
    month: document.getElementById('mv-month').value.trim(),
    gross: document.getElementById('mv-gross').value,
    cogs: document.getElementById('mv-cogs').value,
    capture: document.getElementById('mv-capture').value,
    reviews: document.getElementById('mv-reviews').value,
    keep: document.getElementById('mv-keep').value.trim(),
    cut: document.getElementById('mv-cut').value.trim(),
    saved: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
    savedAt: Date.now()
  };
  if (!m.month) return alert('Add the month first.');
  if (!m.keep || !m.cut) return alert('Add one keep line and one cut line.');
  const idx = S.monthlies.findIndex(x => x.month === m.month);
  if (idx >= 0) S.monthlies[idx] = m; else S.monthlies.unshift(m);
  if (S.monthlies.length > 24) S.monthlies.pop();
  save('monthlies');
  renderMonthlyHist();
  renderCadenceLock();
  ['mv-month','mv-gross','mv-cogs','mv-capture','mv-reviews','mv-keep','mv-cut'].forEach(id => document.getElementById(id).value = '');
}

function renderMonthlyHist() {
  const el = document.getElementById('monthly-hist');
  if (!el) return;
  if (!S.monthlies.length) {
    el.innerHTML = '<div style="font-size:14px;color:var(--ink-light);">No monthly reviews yet. Save one this month.</div>';
    return;
  }
  el.innerHTML = S.monthlies.slice(0, 6).map(m => {
    return `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
        <span style="font-size:15px;font-weight:500;color:var(--ink);">${m.month}</span>
        <span style="font-size:13px;color:var(--ink-light);">${m.saved}</span>
      </div>
      <div style="font-size:13px;color:var(--ink-light);">Gross $${(parseFloat(m.gross)||0).toLocaleString()} · COGS ${m.cogs||0}% · Capture ${m.capture||0}% · Reviews ${m.reviews||0}</div>
      <div style="font-size:13px;color:var(--ink-mid);margin-top:2px;">Keep: ${m.keep}</div>
      <div style="font-size:13px;color:var(--ink-mid);margin-top:1px;">Cut: ${m.cut}</div>
    </div>`;
  }).join('');
}

function renderReviewHist() {
  const el = document.getElementById('review-hist');
  if (!el) return;
  if (!S.reviews.length) { el.innerHTML = '<div style="font-size:14px;color:var(--ink-light);">No reviews yet. Fill in the form and save.</div>'; return; }
  el.innerHTML = S.reviews.slice(0, 8).map(r => {
    const grossN = parseFloat(r.gross) || 0;
    const pct = Math.round(grossN / GROSS_TARGET * 100);
    const col = grossN >= GROSS_TARGET ? 'var(--green)' : grossN >= PHASE1_TARGET ? 'var(--amber)' : 'var(--accent)';
    return `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
        <span style="font-size:15px;font-weight:500;color:var(--ink);">${r.week}</span>
        <span style="font-size:15px;font-family:'Jost', sans-serif;color:${col};">$${grossN.toLocaleString()}</span>
      </div>
      <div style="font-size:13px;color:var(--ink-light);">${pct}% of $8,914 target · COGS ${r.cogs||'—'}% · SMS list ${r.sms||'—'} · Sunday ${r.sunday||'—'} covers</div>
      ${(r.loyaltyNew || r.loyaltyRate || r.reviewsNew) ? `<div style="font-size:13px;color:var(--ink-light);margin-top:2px;">Loyalty — new ${r.loyaltyNew||0} · capture ${r.loyaltyRate||0}% · reviews ${r.reviewsNew||0}</div>` : ''}
      ${(r.srcIg || r.srcGoogle || r.srcWalk || r.srcRef) ? `<div style="font-size:13px;color:var(--ink-light);margin-top:2px;">Sources — IG ${r.srcIg||0} · Google ${r.srcGoogle||0} · Walk-by ${r.srcWalk||0} · Referral ${r.srcRef||0}</div>` : ''}
      ${(r.return7 || r.firsttime || r.return7pct) ? `<div style="font-size:13px;color:var(--ink-light);margin-top:2px;">Sunday Engine — return7 ${r.return7||0} · first-time ${r.firsttime||0} · proxy ${r.return7pct||0}% · loop ${r.loopFri ? 'F✓' : 'F✗'} ${r.loopSun ? 'S✓' : 'S✗'} ${r.loopMon ? 'M✓' : 'M✗'}</div>` : ''}
      <div style="font-size:13px;color:var(--ink-light);margin-top:2px;">Content — Plan ${r.contentPlanned ? '✓' : '✗'} · Shot ${r.contentShot ? '✓' : '✗'} · Posted ${r.contentPosted ? '✓' : '✗'}</div>
      ${r.q6 ? `<div style="font-size:14px;color:var(--ink-mid);margin-top:3px;font-style:italic;">Priority: ${r.q6}</div>` : ''}
    </div>`;
  }).join('');
}

function renderPaceTracker() {
  const el = document.getElementById('pace-tracker');
  if (!el || S.reviews.length < 2) return;
  const recent = S.reviews.slice(0, 6).reverse();
  el.innerHTML = recent.map(r => {
    const g = parseFloat(r.gross) || 0;
    const w = Math.min(100, Math.round(g / GROSS_TARGET * 100));
    const col = g >= GROSS_TARGET ? 'var(--green)' : g >= PHASE1_TARGET ? 'var(--amber)' : 'var(--accent)';
    return `<div style="margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-mid);margin-bottom:2px;">
        <span>${r.week}</span><span style="color:${col};">$${g.toLocaleString()}</span>
      </div>
      <div class="prog"><div class="prog-f" style="width:${w}%;background:${col};"></div></div>
    </div>`;
  }).join('');
}

// ── DECISIONS ──
function initDecisions() {
  renderDecisionsList();
}

function saveDecision() {
  const name = document.getElementById('dec-name').value.trim();
  if (!name) return;
  const d = {
    id: Date.now(),
    name,
    start: document.getElementById('dec-start').value.trim(),
    review: document.getElementById('dec-review').value.trim(),
    phase: document.getElementById('dec-phase').value,
    hyp: document.getElementById('dec-hyp').value.trim(),
    pass: document.getElementById('dec-pass').value.trim(),
    fail: document.getElementById('dec-fail').value.trim(),
    status: 'active',
    outcome: '',
    added: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' })
  };
  S.decisions.unshift(d);
  save('decisions');
  ['dec-name','dec-start','dec-review','dec-hyp','dec-pass','dec-fail'].forEach(id => document.getElementById(id).value = '');
  renderDecisionsList();
}

function addDecision() {
  document.getElementById('dec-name').focus();
  document.getElementById('dec-name').scrollIntoView({ behavior: 'smooth' });
}

function updateDecisionStatus(id, status) {
  const d = S.decisions.find(x => x.id === id);
  if (!d) return;
  d.status = status;
  if (status !== 'active') {
    const outcome = prompt(`Outcome for "${d.name}": what happened?`);
    if (outcome) d.outcome = outcome;
  }
  save('decisions');
  renderDecisionsList();
}

function renderDecisionsList() {
  const el = document.getElementById('decisions-list');
  if (!el) return;
  if (!S.decisions.length) { el.innerHTML = ''; return; }
  const active = S.decisions.filter(d => d.status === 'active');
  const closed = S.decisions.filter(d => d.status !== 'active');
  let html = '';
  if (active.length) {
    html += `<div class="sl">Active experiments (${active.length})</div>`;
    html += active.map(d => decisionCard(d)).join('');
  }
  if (closed.length) {
    html += `<div class="sl" style="margin-top:1rem;">Completed (${closed.length})</div>`;
    html += closed.map(d => decisionCard(d)).join('');
  }
  el.innerHTML = html;
}

function decisionCard(d) {
  const statusBadge = d.status === 'active' ? '<span class="badge ba">Active</span>'
    : d.status === 'passed' ? '<span class="badge bg">Passed</span>'
    : d.status === 'failed' ? '<span class="badge br">Failed</span>'
    : '<span class="badge bn">Adjusted</span>';
  return `<div class="card" style="margin-bottom:9px;border-left:3px solid ${d.status==='active'?'var(--amber)':d.status==='passed'?'var(--green)':'var(--ink-faint)'};">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
      <div style="font-size:14px;font-weight:500;color:var(--ink);">${d.name}</div>
      ${statusBadge}
    </div>
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:6px;">${d.phase} · Started ${d.start || d.added}${d.review ? ' · Review by ' + d.review : ''}</div>
    ${d.hyp ? `<div style="font-size:14px;color:var(--ink-mid);margin-bottom:4px;"><strong>Hypothesis:</strong> ${d.hyp}</div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:${d.status==='active'?'8':'4'}px;">
      ${d.pass ? `<div style="background:var(--green-light);border-radius:4px;padding:5px 8px;font-size:13px;color:var(--green);"><strong>Pass:</strong> ${d.pass}</div>` : ''}
      ${d.fail ? `<div style="background:var(--red-light);border-radius:4px;padding:5px 8px;font-size:13px;color:var(--red);"><strong>Fail:</strong> ${d.fail}</div>` : ''}
    </div>
    ${d.outcome ? `<div style="font-size:14px;color:var(--ink-mid);margin-bottom:6px;font-style:italic;">Outcome: ${d.outcome}</div>` : ''}
    ${d.status === 'active' ? `<div style="display:flex;gap:6px;">
      <button class="btn btn-sm btn-o" onclick="updateDecisionStatus(${d.id},'passed')">✓ Passed</button>
      <button class="btn btn-sm btn-o" onclick="updateDecisionStatus(${d.id},'failed')">✗ Failed</button>
      <button class="btn btn-sm btn-o" onclick="updateDecisionStatus(${d.id},'adjusted')">~ Adjusted</button>
    </div>` : ''}
  </div>`;
}

// ── EXPORT / IMPORT / SNAPSHOT ──
function initDataPage() {
  const el = document.getElementById('data-inventory');
  if (!el) return;
  el.innerHTML = `
    <div class="pr"><span class="pk">Revenue logs</span><span class="pv">${S.logs.length} entries</span></div>
    <div class="pr"><span class="pk">Weekly reviews</span><span class="pv">${S.reviews.length} saved</span></div>
    <div class="pr"><span class="pk">Active experiments</span><span class="pv">${S.decisions.filter(d=>d.status==='active').length} running</span></div>
    <div class="pr"><span class="pk">DJs in roster</span><span class="pv">${S.djs.length}</span></div>
    <div class="pr"><span class="pk">Anchor nodes</span><span class="pv">${S.anchors.length}</span></div>
    <div class="pr"><span class="pk">Notes saved</span><span class="pv">${S.notes.length}</span></div>
    <div style="font-size:13px;color:var(--ink-light);margin-top:8px;">Last export: check your downloads folder.</div>
  `;
}

function exportData() {
  const allData = {
    exported: new Date().toISOString(),
    version: 7,
    logs: S.logs,
    checks: S.checks,
    djs: S.djs,
    anchors: S.anchors,
    notes: S.notes,
    sunday: S.sunday,
    reviews: S.reviews,
    monthlies: S.monthlies,
    decisions: S.decisions,
    ui: S.ui,
  };
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `hideout-console-${dateStr}.json`;
  a.click(); URL.revokeObjectURL(url);
}

function importData() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.logs) { S.logs = d.logs; save('logs'); }
      if (d.checks) { S.checks = d.checks; save('checks'); }
      if (d.djs) { S.djs = d.djs; save('djs'); }
      if (d.anchors) { S.anchors = d.anchors; save('anchors'); }
      if (d.notes) { S.notes = d.notes; save('notes'); }
      if (d.sunday) { S.sunday = d.sunday; save('sunday'); }
      if (d.reviews) { S.reviews = d.reviews; save('reviews'); }
      if (d.monthlies) { S.monthlies = d.monthlies; save('monthlies'); }
      if (d.decisions) { S.decisions = d.decisions; save('decisions'); }
      if (d.ui && typeof d.ui === 'object') { S.ui = d.ui; save('app'); }
      persistImportMerge().then(() => {
        document.getElementById('import-status').textContent = '✓ Data imported and synced.';
        document.getElementById('import-status').style.color = 'var(--green)';
        initDataPage();
      }).catch(() => {
        document.getElementById('import-status').textContent = '✗ Local import applied but cloud sync failed — check session.';
        document.getElementById('import-status').style.color = 'var(--red)';
        initDataPage();
      });
    } catch(err) {
      document.getElementById('import-status').textContent = '✗ Error reading file. Make sure it\'s a valid Hideout export.';
      document.getElementById('import-status').style.color = 'var(--red)';
    }
  };
  reader.readAsText(file);
}

function generateSnapshot() {
  const now = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const totalWTD = S.logs.slice(0, 7).reduce((s,l) => s + l.rev, 0);
  const totalContacts = S.logs.reduce((s,l) => s + (parseInt(l.contacts)||0), 0);
  const lastReview = S.reviews[0] || null;
  const activeExps = S.decisions.filter(d => d.status === 'active');

  let snap = `HIDEOUT CONSOLE SNAPSHOT — ${now}\n`;
  snap += `${'='.repeat(50)}\n\n`;

  snap += `REVENUE (last 7 logged days)\n`;
  snap += `Week-to-date gross: $${totalWTD.toLocaleString()} / $${GROSS_TARGET.toLocaleString()} target (${Math.round(totalWTD/GROSS_TARGET*100)}%)\n`;
  snap += `Daily target: $${DAILY_TARGET.toLocaleString()}\n`;
  if (S.logs.length) {
    snap += `Recent logs:\n`;
    S.logs.slice(0,7).forEach(l => {
      snap += `  ${l.date}: $${l.rev} · ${l.orders||'?'} orders${l.top?' · '+l.top:''}${l.contacts?' · '+l.contacts+' new SMS':''}\n`;
    });
  } else { snap += `  No revenue logged yet.\n`; }
  snap += `Total SMS contacts captured (all time): ${totalContacts}\n\n`;

  snap += `SUNDAY SLOT\n`;
  const sun = S.sunday;
  snap += `Status: ${sun.status||'not set'} · DJ: ${sun.dj||'—'}\n\n`;

  snap += `WEEKLY CHECKLIST COMPLETION\n`;
  const weekCheckIds = ['wc1','wc2','wc3','wc4','wc5','wc6','wc7','wc8'];
  const weekCheckNames = ['COGS check (Mon)','Inventory (Tue)','Confirm DJ (Fri)','IG story (Fri)','SMS blast (Sat)','Sunday slot ran','Say next Sunday to guests','Log week + confirm next DJ'];
  weekCheckIds.forEach((id,i) => {
    snap += `  ${S.checks[id] ? '✓' : '✗'} ${weekCheckNames[i]}\n`;
  });
  snap += '\n';

  if (lastReview) {
    snap += `LAST WEEKLY REVIEW (${lastReview.week})\n`;
    snap += `Gross: $${lastReview.gross||'—'} · Orders: ${lastReview.orders||'—'} · Avg ticket: $${lastReview.ticket||'—'} · COGS: ${lastReview.cogs||'—'}%\n`;
    snap += `SMS list size: ${lastReview.sms||'—'} · Sunday covers: ${lastReview.sunday||'—'}\n`;
    snap += `Sunday ran: ${lastReview.q1||'—'}\n`;
    snap += `Said next Sunday cue: ${lastReview.q2||'—'}\n`;
    snap += `SMS capture: ${lastReview.q3||'—'}\n`;
    snap += `What worked: ${lastReview.q4||'—'}\n`;
    snap += `What didn't: ${lastReview.q5||'—'}\n`;
    snap += `Next week priority: ${lastReview.q6||'—'}\n\n`;
  } else { snap += `LAST WEEKLY REVIEW\n  None saved yet.\n\n`; }

  snap += `ACTIVE EXPERIMENTS (${activeExps.length})\n`;
  if (!activeExps.length) { snap += `  None running yet.\n`; }
  activeExps.forEach(d => {
    snap += `  [${d.phase}] ${d.name} — started ${d.start||d.added}\n`;
    snap += `  Pass: ${d.pass||'—'}\n`;
    snap += `  Fail: ${d.fail||'—'}\n`;
  });
  snap += '\n';

  snap += `TARGETS (for reference)\n`;
  snap += `Gross target: $8,914/wk → Net $4,000/wk (56% contribution margin − $992 fixed)\n`;
  snap += `Daily target: $1,438 · Orders: ~72–90/day · Avg ticket: $16–24\n`;
  snap += `COGS target: ≤30% · SMS list growth: 15–20 new/wk\n`;

  document.getElementById('snapshot-out').value = snap;
}

function copySnapshot() {
  const el = document.getElementById('snapshot-out');
  el.select();
  document.execCommand('copy');
  // Brief feedback
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = orig, 1500);
}

function copyAdvisorPrompt() {
  const prompt = `Here is my Hideout console data for the week of [DATE].

[PASTE SNAPSHOT HERE]

Review my numbers vs. targets. Review my weekly review answers. Review my active experiments and their pass/fail status.

Tell me:
1. What does the data say is working?
2. What should I adjust or stop?
3. Confirm or change my one priority for next week.

Be direct. No hedging. If something has strong evidence, say so. If it's inference, say that too.`;
  navigator.clipboard.writeText(prompt).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = prompt; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = orig, 1500);
}
function onInventoryHaveInput(i, value) {
  if (!invData[i]) return;
  invData[i].have = value;
  S.ui.inventoryHave = invData.map(r => r.have ?? '');
  save('app');
  updateInvSummary();
}

function applyPersistedInventorySpend() {
  const s = S.ui.inventorySpend || {};
  const mapping = {
    'spend-costco': 'costco',
    'spend-depot': 'depot',
    'spend-other': 'other',
    'spend-amazon': 'amazon',
    'spend-perla': 'perla',
    'spend-rev': 'rev',
  };
  Object.keys(mapping).forEach(id => {
    const el = document.getElementById(id);
    const key = mapping[id];
    if (el && s[key] !== undefined) el.value = s[key];
  });
}

// ── BRICE TAB ──
// Business at a glance. Made / Spent / Kept. Mon–Sun.
// Spend lives in S.ui.briceSpend — array of weekly spend entries.
// Propagates into S.ui.inventorySpend so COGS tab stays in sync.

function getBriceWeekKey() {
  // Returns YYYY-WW string for current Mon–Sun week
  const now = getMiamiNow();
  const d = new Date();
  const day = now.day === 0 ? 7 : now.day; // Mon=1 Sun=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  return monday.toLocaleDateString('en-CA'); // YYYY-MM-DD of Monday
}

function getBriceSpendThisWeek() {
  if (!S.ui.briceSpend || !Array.isArray(S.ui.briceSpend)) S.ui.briceSpend = [];
  const weekKey = getBriceWeekKey();
  return S.ui.briceSpend.filter(e => e.weekKey === weekKey);
}

function briceWeekTotal() {
  return getBriceSpendThisWeek().reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
}

function briceAddSpend() {
  const supplier = document.getElementById('bs-supplier')?.value?.trim();
  const amount = parseFloat(document.getElementById('bs-amount')?.value);
  const dateRaw = document.getElementById('bs-date')?.value?.trim();
  if (!supplier) { alert('Pick a supplier.'); return; }
  if (!amount || isNaN(amount) || amount <= 0) { alert('Enter an amount.'); return; }

  const dateLabel = dateRaw || new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const weekKey = getBriceWeekKey();

  if (!S.ui.briceSpend) S.ui.briceSpend = [];
  S.ui.briceSpend.unshift({
    id: Date.now(),
    weekKey,
    supplier,
    amount,
    date: dateLabel,
    addedAt: Date.now(),
  });
  // Keep last 200 entries
  if (S.ui.briceSpend.length > 200) S.ui.briceSpend.pop();

  // ── Propagate into inventorySpend so COGS tab sees it ──
  bricePropagateToCOGS();
  save('app');

  // Clear form
  const supEl = document.getElementById('bs-supplier');
  const amtEl = document.getElementById('bs-amount');
  const dtEl = document.getElementById('bs-date');
  if (supEl) supEl.value = '';
  if (amtEl) amtEl.value = '';
  if (dtEl) dtEl.value = '';

  renderBriceSpendList();
  renderBriceSummaryNumbers(S.ui.briceWeekData || null);
}

function briceRemoveSpend(id) {
  if (!S.ui.briceSpend) return;
  S.ui.briceSpend = S.ui.briceSpend.filter(e => e.id !== id);
  bricePropagateToCOGS();
  save('app');
  renderBriceSpendList();
  renderBriceSummaryNumbers(S.ui.briceWeekData || null);
}

function bricePropagateToCOGS() {
  // Accumulate this week's spend by supplier into S.ui.inventorySpend
  const entries = getBriceSpendThisWeek();
  const acc = { costco: 0, depot: 0, perla: 0, other: 0, amazon: 0 };
  const map = {
    'instacart': 'other',
    'zak the baker': 'other',
    "perl'a": 'perla',
    'bola granola': 'other',
    'restaurant depot': 'depot',
    'amazon': 'amazon',
    'webstaurantstore': 'other',
    'sprouts': 'other',
    'live ultimate shrooms': 'other',
    'terrasoul': 'other',
    'costco': 'costco',
    'other': 'other',
  };
  entries.forEach(e => {
    const key = map[(e.supplier || '').toLowerCase()] || 'other';
    acc[key] += parseFloat(e.amount) || 0;
  });
  if (!S.ui.inventorySpend) S.ui.inventorySpend = {};
  if (acc.costco) S.ui.inventorySpend.costco = String(Math.round(acc.costco * 100) / 100);
  if (acc.depot)  S.ui.inventorySpend.depot  = String(Math.round(acc.depot * 100) / 100);
  if (acc.perla)  S.ui.inventorySpend.perla  = String(Math.round(acc.perla * 100) / 100);
  if (acc.amazon) S.ui.inventorySpend.amazon = String(Math.round(acc.amazon * 100) / 100);
  if (acc.other)  S.ui.inventorySpend.other  = String(Math.round(acc.other * 100) / 100);
}

function renderBriceSpendList() {
  const el = document.getElementById('brice-spend-list');
  const totalEl = document.getElementById('brice-spend-total');
  if (!el) return;
  const entries = getBriceSpendThisWeek();
  if (!entries.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">No spend logged this week yet.</div>';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }
  el.innerHTML = entries.map(e =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
      <div>
        <span style="font-size:14px;font-weight:500;color:var(--ink);">${e.supplier}</span>
        <span style="font-size:12px;color:var(--ink-light);margin-left:8px;">${e.date}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:500;color:var(--accent);">$${Number(e.amount).toFixed(2)}</span>
        <span onclick="briceRemoveSpend(${e.id})" style="cursor:pointer;color:var(--ink-light);font-size:16px;line-height:1;">×</span>
      </div>
    </div>`
  ).join('');
  const total = briceWeekTotal();
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

function renderBriceSummaryNumbers(weekData) {
  const madeEl = document.getElementById('brice-made');
  const madeSubEl = document.getElementById('brice-made-sub');
  const spentEl = document.getElementById('brice-spent');
  const keptEl = document.getElementById('brice-kept');
  const keptSubEl = document.getElementById('brice-kept-sub');
  const keptCard = document.getElementById('brice-kept-card');

  const spent = briceWeekTotal();
  const made = weekData ? weekData.weekGross : S.logs.slice(0, 7).reduce((s, l) => s + (l.rev || 0), 0);
  const kept = made - spent;
  const keptPct = made > 0 ? Math.round((kept / made) * 100) : 0;

  if (madeEl) madeEl.textContent = '$' + made.toLocaleString();
  if (madeSubEl) madeSubEl.textContent = weekData ? `${weekData.weekOrders} orders Mon–Sun` : 'From logged days';
  if (spentEl) spentEl.textContent = '$' + spent.toFixed(2);
  if (keptEl) keptEl.textContent = '$' + kept.toLocaleString();
  if (keptSubEl) keptSubEl.textContent = kept >= 0 ? `${keptPct}% gross margin · before fixed costs` : 'Spend exceeded revenue this week';
  if (keptCard) keptCard.style.borderLeft = '3px solid ' + (kept >= made * 0.4 ? 'var(--green)' : kept >= 0 ? 'var(--amber)' : 'var(--red)');
  if (keptEl) keptEl.style.color = kept >= 0 ? 'var(--ink)' : 'var(--red)';
}

function renderBriceChart(weekData) {
  const el = document.getElementById('brice-chart');
  if (!el) return;

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = weekData ? weekData.days : [];

  if (!days.length) {
    el.innerHTML = '<div style="color:var(--ink-light);font-size:13px;align-self:center;">Sync Square to load week</div>';
    return;
  }

  const maxRev = Math.max(...days.map(d => d.grossSales), 500);
  const spentEntries = getBriceSpendThisWeek();

  // Spread spend across days proportionally by revenue (simple heuristic)
  const totalRev = days.reduce((s, d) => s + d.grossSales, 0);
  const totalSpent = briceWeekTotal();

  el.innerHTML = days.map((day, i) => {
    const revH = Math.round((day.grossSales / maxRev) * 120);
    // Allocate spend proportionally to revenue weight
    const spendAlloc = totalRev > 0 ? (day.grossSales / totalRev) * totalSpent : 0;
    const spendH = Math.round((spendAlloc / maxRev) * 120);
    const isToday = day.date === todayIsoDate();
    const atFloor = day.grossSales >= 500;

    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <div style="font-size:11px;color:${day.grossSales > 0 ? 'var(--ink)' : 'var(--ink-light)'};">
        ${day.grossSales > 0 ? '$' + Math.round(day.grossSales) : '—'}
      </div>
      <div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:120px;gap:2px;position:relative;">
        ${spendH > 0 ? `<div style="width:100%;height:${spendH}px;background:var(--accent);opacity:0.5;border-radius:3px 3px 0 0;"></div>` : ''}
        <div style="width:100%;height:${Math.max(revH, 2)}px;background:${atFloor ? 'var(--green)' : 'var(--ink-faint)'};border-radius:3px 3px 0 0;opacity:${day.grossSales > 0 ? '1' : '0.3'};"></div>
      </div>
      <div style="font-size:11px;color:${isToday ? 'var(--amber)' : 'var(--ink-light)'};font-weight:${isToday ? '600' : '400'};">${DAY_LABELS[i]}</div>
    </div>`;
  }).join('');
}

function renderBriceTopItems(weekData) {
  const el = document.getElementById('brice-top-items');
  if (!el) return;
  if (!weekData || !weekData.topItems || !weekData.topItems.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">Sync Square to see item breakdown</div>';
    return;
  }
  const maxSales = weekData.topItems[0]?.grossSales || 1;
  el.innerHTML = weekData.topItems.slice(0, 8).map((item, i) => {
    const barW = Math.round((item.grossSales / maxSales) * 100);
    return `<div style="margin-bottom:9px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
        <span style="font-size:13px;font-weight:${i < 3 ? '500' : '400'};color:var(--ink);">${item.name}</span>
        <span style="font-size:13px;color:var(--ink-mid);">$${item.grossSales.toFixed(0)} · ${Math.round(item.quantity)} sold</span>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;">
        <div style="height:4px;width:${barW}%;background:${i === 0 ? 'var(--green)' : 'var(--accent)'};border-radius:2px;opacity:${i === 0 ? 1 : 0.6};"></div>
      </div>
    </div>`;
  }).join('');
}

const BRICE_RECIPE_HINTS = [
  {
    match: ['erik', 'salmon'],
    ingredients: [
      { label: 'Salmon', perUnit: 2, unit: 'oz' },
      { label: 'Bread', perUnit: 2, unit: 'slices' },
    ],
  },
  {
    match: ['brice', 'pb bowl'],
    ingredients: [
      { label: 'Bananas', perUnit: 1, unit: 'ea' },
      { label: 'Peanut butter', perUnit: 1.5, unit: 'oz' },
      { label: 'Oat milk', perUnit: 4, unit: 'oz' },
      { label: 'Granola', perUnit: 1, unit: 'oz' },
    ],
  },
  {
    match: ['acai', 'açaí'],
    ingredients: [
      { label: 'Acai base', perUnit: 6, unit: 'oz' },
      { label: 'Granola', perUnit: 1, unit: 'oz' },
      { label: 'Bananas', perUnit: 0.5, unit: 'ea' },
    ],
  },
  {
    match: ['toast'],
    ingredients: [
      { label: 'Bread', perUnit: 2, unit: 'slices' },
    ],
  },
  {
    match: ['latte', 'matcha', 'coffee', 'cold brew'],
    ingredients: [
      { label: 'Oat milk', perUnit: 3, unit: 'oz' },
    ],
  },
];

function findRecipeHint(itemName) {
  const n = (itemName || '').toLowerCase();
  return BRICE_RECIPE_HINTS.find(r => r.match.some(token => n.includes(token)));
}

function renderBriceDepletionHints(weekData) {
  const el = document.getElementById('brice-depletion-hints');
  if (!el) return;
  if (!weekData || !Array.isArray(weekData.topItems) || !weekData.topItems.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">Sync Square to see top-item depletion hints.</div>';
    return;
  }

  const hints = [];
  weekData.topItems.slice(0, 5).forEach(item => {
    const recipe = findRecipeHint(item.name);
    if (!recipe) return;
    const sold = Number(item.quantity || 0);
    recipe.ingredients.forEach(ing => {
      hints.push({
        ingredient: ing.label,
        text: `${item.name} sold ${Math.round(sold)}x. Estimated ${ing.label} use: ${(sold * ing.perUnit).toFixed(1)} ${ing.unit}.`,
      });
    });
  });

  if (!hints.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">No mapped recipe hints for top items yet.</div>';
    return;
  }

  el.innerHTML = hints.slice(0, 8).map(h => `
    <div style="padding:7px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:13px;color:var(--ink);font-weight:500;">${h.ingredient}</div>
      <div style="font-size:13px;color:var(--ink-mid);margin-top:1px;">${h.text}</div>
      <div style="font-size:11px;color:var(--ink-light);margin-top:3px;">Heuristic estimate from top-5 weekly item sales.</div>
    </div>
  `).join('');
}

function renderBriceOrderRhythm(weekData) {
  const el = document.getElementById('brice-order-rhythm');
  if (!el) return;
  if (!weekData || !weekData.days) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">Sync Square to see order patterns</div>';
    return;
  }
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rows = weekData.days.filter(d => d.orderCount > 0).map((d, i) => {
    const label = DAY_LABELS[weekData.days.indexOf(d)] || '';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:13px;color:var(--ink);width:40px;">${label}</span>
      <span style="font-size:13px;color:var(--ink-mid);">${d.orderCount} orders</span>
      <span style="font-size:13px;color:var(--ink-mid);">avg $${d.avgTicket}</span>
      <span style="font-size:14px;font-weight:500;color:${d.grossSales >= 500 ? 'var(--green)' : 'var(--ink)'};">$${d.grossSales.toFixed(0)}</span>
    </div>`;
  });
  if (!rows.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--ink-light);">No orders recorded this week yet.</div>';
    return;
  }
  const totalOrders = weekData.weekOrders;
  const avgTicket = totalOrders > 0 ? (weekData.weekGross / totalOrders).toFixed(2) : '—';
  el.innerHTML = rows.join('') +
    `<div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:4px;">
      <span style="font-size:13px;color:var(--ink-light);">${totalOrders} orders total</span>
      <span style="font-size:13px;color:var(--ink-light);">avg ticket $${avgTicket}</span>
    </div>`;
}

async function loadBriceWeek() {
  const btn = document.getElementById('brice-sync-btn');
  const labelEl = document.getElementById('brice-week-label');
  if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

  try {
    const date = todayIsoDate();
    const res = await fetch('/api/square/weekly-summary?date=' + encodeURIComponent(date), {
      headers: { Accept: 'application/json' },
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (labelEl) labelEl.textContent = 'Square unavailable — spend data still works below';
      renderBriceSummaryNumbers(null);
      renderBriceDepletionHints(null);
      renderBriceSpendList();
      return;
    }

    // Cache week data
    S.ui.briceWeekData = body;
    save('app');

    const { weekRange } = body;
    if (labelEl && weekRange) {
      labelEl.textContent = `Week of ${formatIsoDateToLabel(weekRange.start)} – ${formatIsoDateToLabel(weekRange.end)}`;
    }

    renderBriceSummaryNumbers(body);
    renderBriceChart(body);
    renderBriceTopItems(body);
    renderBriceDepletionHints(body);
    renderBriceOrderRhythm(body);
    renderBriceSpendList();

  } catch (err) {
    if (labelEl) labelEl.textContent = 'Sync failed — check connection';
    renderBriceSummaryNumbers(null);
    renderBriceDepletionHints(null);
    renderBriceSpendList();
  } finally {
    if (btn) { btn.textContent = 'Sync Square'; btn.disabled = false; }
  }
}

function initBrice() {
  // Pre-fill today's date in the spend form
  const dtEl = document.getElementById('bs-date');
  if (dtEl && !dtEl.value) {
    dtEl.value = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  // Show week label from cache if available
  const labelEl = document.getElementById('brice-week-label');
  const cached = S.ui.briceWeekData;
  if (cached && cached.weekRange && labelEl) {
    labelEl.textContent = `Week of ${formatIsoDateToLabel(cached.weekRange.start)} – ${formatIsoDateToLabel(cached.weekRange.end)}`;
    renderBriceSummaryNumbers(cached);
    renderBriceChart(cached);
    renderBriceTopItems(cached);
    renderBriceDepletionHints(cached);
    renderBriceOrderRhythm(cached);
  } else {
    renderBriceSummaryNumbers(null);
    renderBriceDepletionHints(null);
    if (labelEl) labelEl.textContent = 'Tap Sync Square to load this week';
  }
  renderBriceSpendList();
}

function briceSetScanStatus(msg, tone = 'muted') {
  const el = document.getElementById('bs-scan-status');
  if (!el) return;
  const colors = {
    muted: 'var(--ink-light)',
    ok: 'var(--green)',
    warn: 'var(--amber)',
    err: 'var(--red)',
  };
  el.style.display = 'block';
  el.style.color = colors[tone] || colors.muted;
  el.textContent = msg;
}

function briceScanInvoice() {
  const input = document.getElementById('bs-invoice-file');
  if (!input) return;
  input.value = '';
  input.click();
}

async function briceHandleInvoiceFile(files) {
  const file = files && files[0];
  if (!file) return;
  briceSetScanStatus('Scanning invoice…', 'muted');
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/invoice/scan', { method: 'POST', body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      briceSetScanStatus(body.message || 'Invoice scan failed.', 'err');
      return;
    }
    const supplierEl = document.getElementById('bs-supplier');
    const amountEl = document.getElementById('bs-amount');
    if (supplierEl && body.supplier) supplierEl.value = body.supplier;
    if (amountEl && body.amount) amountEl.value = String(body.amount);
    briceSetScanStatus(`Read invoice · ${body.supplier || 'Supplier'} · $${body.amount || '0.00'}. Confirm then Add.`, 'ok');
  } catch (err) {
    briceSetScanStatus('Invoice scan unavailable. Enter manually.', 'warn');
  }
}

if (typeof window !== 'undefined') {
  window.initBrice = initBrice;
  window.loadBriceWeek = loadBriceWeek;
  window.briceAddSpend = briceAddSpend;
  window.briceRemoveSpend = briceRemoveSpend;
  window.briceScanInvoice = briceScanInvoice;
  window.briceHandleInvoiceFile = briceHandleInvoiceFile;
}

if (typeof window !== 'undefined') {
  Object.assign(window, { save, nav, initStatus, initToday, highlightRunbookDay, daysSince, renderCadenceLock, renderWeekChecks, toggleCheck, logDay, clearSquareSyncStatus, setSquareSyncStatus, todayIsoDate, formatIsoDateToLabel, getMiamiNow, isAfterCloseMiami, findTodayLogIndex, upsertSquareFacts, rerenderTodayAfterSquareSave, syncSquareToday, maybeAutoSquareToday, saveTodayLever, loadTodayLever, suggestTodayLever, renderLogHist, updateWTD, updatePaceLine, renderSundayBlock, editSundaySlot, clearSundaySlot, renderWeeklyLever, renderWeeklyRisk, renderCaptureStatus, updateStatusCards, initSundaySlot, saveSunday, updateSundayCard, initWeek, resetWeekChecks, renderCalendar, initCOGS, toggleCOGSCheck, calcCOGS, calcCoffeeYield, resetDJForm, currentDJForm, addDJ, editDJ, renderDJs, removeDJ, addAnchor, renderAnchors, removeAnchor, initPnl, calcBE, renderInv, updateInvSummary, calcWeeklySpend, initOps, toggleOps, resetOps, saveNote, renderSavedNotes, initReview, saveReview, saveMonthly, renderMonthlyHist, renderReviewHist, renderPaceTracker, initDecisions, saveDecision, addDecision, updateDecisionStatus, renderDecisionsList, decisionCard, initDataPage, exportData, importData, generateSnapshot, copySnapshot, copyAdvisorPrompt, onInventoryHaveInput, applyPersistedInventorySpend, renderRequiredQueue, queueToggleExpand, queueSyncSquare, queueSetInv, queueUpdateSpend, queueSaveInv, queueSaveSpend, queueSkipSpend, queueSaveObs, queueSetDJ, initBrice, loadBriceWeek, briceAddSpend, briceRemoveSpend, renderTodayExecutionState });
}
