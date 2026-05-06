import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '..', 'hideout_console_v16.html');
const OUT_HTML = path.join(ROOT, 'index.html');
const OUT_JS = path.join(ROOT, 'src', 'console-app.js');

fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });

const raw = fs.readFileSync(SOURCE, 'utf8');
const scriptOpen = raw.indexOf('<script>');
const scriptClose = raw.lastIndexOf('</script>');
if (scriptOpen < 0 || scriptClose <= scriptOpen) throw new Error('Could not locate <script> block in hideout_console_v16.html');

let html = raw.slice(0, scriptOpen).trimEnd();
let js = raw.slice(scriptOpen + '<script>'.length, scriptClose).trim();

const sMarker = js.indexOf('const S = {');
const saveMarker = js.indexOf('const save = k => ', sMarker);
if (sMarker < 0 || saveMarker < 0) throw new Error('Could not find S / save bootstrap in console script');

const saveLineEnd = js.indexOf(';', saveMarker);
if (saveLineEnd < 0) throw new Error('Malformed save line');
const beforeS = js.slice(0, sMarker);
const afterSave = js.slice(saveLineEnd + 1);

js =
  `import { persistKey, persistImportMerge, getTodayLever, setTodayLever } from './persist.js';

${beforeS}const S = globalThis.__HIDEOUT_BOOT__.S;
if (!S.ui || typeof S.ui !== 'object') S.ui = {};

function save(k) {
  persistKey(k);
}
${afterSave}`;

const saveToday = `function saveTodayLever() {
  const lever = document.getElementById('today-lever-choice')?.value || '';
  setTodayLever({ value: lever, manual: lever ? '1' : '0', dayKey: null });
  persistKey('app');
}`;

const loadToday = `function loadTodayLever() {
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
}`;

const suggestToday = `function suggestTodayLever(riskLabel) {
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
}`;

if (!/function saveTodayLever\(\) \{/.test(js)) throw new Error('saveTodayLever pattern missing');
js = js.replace(/function saveTodayLever\(\) \{[\s\S]*?\n\}/m, saveToday);
js = js.replace(/function loadTodayLever\(\) \{[\s\S]*?\n\}/m, loadToday);
js = js.replace(/function suggestTodayLever\(riskLabel\) \{[\s\S]*?\n\}/m, suggestToday);

js = js.replace(
  `    reviews: S.reviews,
    decisions: S.decisions,
  };`,
  `    reviews: S.reviews,
    monthlies: S.monthlies,
    decisions: S.decisions,
    ui: S.ui,
  };`,
);

js = js.replace(/function importData\(\) \{[\s\S]*?\n\}/m, `function importData() {
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
      document.getElementById('import-status').textContent = '✗ Error reading file. Make sure it\\'s a valid Hideout export.';
      document.getElementById('import-status').style.color = 'var(--red)';
    }
  };
  reader.readAsText(file);
}`);

js = js.replace(/function initCOGS\(\) \{[\s\S]*?\n\}/m, `function initCOGS() {
  const el = document.getElementById('cogs-checks');
  if (!el) return;
  el.innerHTML = cogsChecks.map(c => {
    const done = S.checks[c.id];
    return \`<div class="ci" onclick="toggleCOGSCheck('\${c.id}')">
      <div class="cb\${done ? ' on' : ''}"></div>
      <div class="cb-body">
        <div class="cb-main\${done ? ' done' : ''}">\${c.text}</div>
        <div class="cb-note">\${c.note}</div>
      </div>
    </div>\`;
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
}`);

js = js.replace(/function calcCOGS\(\) \{[\s\S]*?\n\}/m, `function calcCOGS() {
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
    \`Total COGS: $\${total.toFixed(2)} / Revenue: $\${rev.toFixed(2)}<br>
     COGS %: <strong style="color:\${color};font-size:15px;">\${pct}%</strong><br>
     <span style="color:\${color};">\${status}</span>\`;
  const sc = document.getElementById('sc-cogs');
  const card = document.getElementById('sc-cogs-card');
  if (sc) sc.textContent = pct + '%';
  if (card) card.className = 's-card ' + (pct <= 28 ? 'green' : pct <= 35 ? 'amber' : 'red');
  renderWeeklyLever();
  renderWeeklyRisk();
}`);

js = js.replace(/function calcCoffeeYield\(\) \{[\s\S]*?\n\}/m, `function calcCoffeeYield() {
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
  out.innerHTML = \`Bean landed cost: <strong>$\${costPerOz.toFixed(3)}/oz</strong> · Espresso shot (@\${doseG}g): <strong>$\${shotCost.toFixed(2)}</strong><br>
  Cold brew bean cost: <strong>$\${coldBrewGalCost.toFixed(2)}/gal</strong> · <strong>$\${coldBrewCupCost.toFixed(2)}</strong> per \${cupOz}oz cup\`;
}`);

js = js.replace(
  `oninput="invData[\${i}].have=this.value;renderInv();updateInvSummary()"`,
  `oninput="onInventoryHaveInput(\${i}, this.value)"`,
);

js = js.replace(/function renderInv\(\) \{[\s\S]*?if \(!tb\) return;/m, `function renderInv() {
  const tb = document.getElementById('inv-tbody');
  if (!tb) return;
  const invHave = S.ui.inventoryHave;
  if (Array.isArray(invHave) && invHave.length === invData.length) {
    invData.forEach((r, i) => { r.have = invHave[i] ?? r.have; });
  }`);

js = js.replace(/function calcWeeklySpend\(\) \{[\s\S]*?\n\}/m, `function calcWeeklySpend() {
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
    \`Total spend: <strong>$\${totalSpend.toFixed(2)}</strong> · Est. supplies (non-food): ~$\${suppliesEst.toFixed(2)} · Food/bev COGS: <strong>$\${foodSpend.toFixed(2)}</strong><br>\` +
    (rev > 0
      ? \`COGS %: <strong style="color:\${color};font-size:14px;">\${cogsPct.toFixed(1)}%</strong> · <span style="color:\${color};">\${status}</span><br><span style="font-size:13px;color:var(--ink-light);">Copy this into COGS Check tab on Monday. Target: ≤30%.</span>\`
      : \`<span style="color:var(--ink-light);">Enter this week's gross revenue to calculate COGS %.</span>\`);
}`);

js += `
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
`;

js = js.replace(
  `renderSavedNotes();`,
  `renderSavedNotes();
applyPersistedInventorySpend();
calcWeeklySpend();`,
);

js = js.replace(
  /function renderSundayBlock\(\) \{[\s\S]*?\n\}\n\nfunction renderWeeklyLever/m,
  `function renderSundayBlock() {
  const el = document.getElementById('sunday-block');
  if (!el) return;
  const s = S.sunday || {};
  const confirmed = s.status === 'confirmed';
  const outreach = s.status === 'outreach';
  const djName = s.dj || '';
  if (confirmed) {
    el.innerHTML = \`<div style="background:var(--green-light);border:1px solid var(--green);border-radius:6px;padding:12px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--green);margin-bottom:2px;">Sunday Slot — Infrastructure</div>
          <div style="font-size:15px;color:var(--ink);font-weight:500;">\${djName ? djName + ' · confirmed' : 'DJ confirmed'} · 10am–3pm</div>
        </div>
        <span class="badge bg">Locked</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px;">
        <button class="btn btn-sm" onclick="editSundaySlot()">Edit</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>\`;
  } else if (outreach) {
    el.innerHTML = \`<div style="background:var(--amber-light);border:2px solid var(--amber);border-radius:6px;padding:12px 16px;">
      <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--amber);margin-bottom:4px;">Sunday Slot — Outreach Sent</div>
      <div style="font-size:14px;color:var(--ink);margin-bottom:8px;">\${djName || 'DJ'} — waiting on confirmation. Follow up today.</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="sun-dj-inline" placeholder="@djhandle" value="\${djName}" style="width:140px;" oninput="document.getElementById('sun-dj').value=this.value">
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='confirmed';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Confirm</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>\`;
  } else {
    el.innerHTML = \`<div style="background:var(--red-light);border:2px solid var(--red);border-radius:6px;padding:14px 16px;">
      <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--red);margin-bottom:4px;">⚠ Sunday Not Booked — This Breaks the System</div>
      <div style="font-size:15px;color:var(--ink-mid);margin-bottom:10px;">The slot is fixed infrastructure. Every week it doesn't run breaks compounding.</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="sun-dj-inline" placeholder="@djhandle" value="\${djName}" style="width:140px;" oninput="document.getElementById('sun-dj').value=this.value">
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='outreach';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Outreach Sent</button>
        <button class="btn btn-sm" onclick="document.getElementById('sun-status').value='confirmed';document.getElementById('sun-dj').value=document.getElementById('sun-dj-inline').value;saveSunday();renderSundayBlock();">Confirm</button>
        <button class="btn btn-sm btn-o" onclick="clearSundaySlot()">Clear</button>
      </div>
    </div>\`;
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

function renderWeeklyLever`,
);

// Sunday inline handle should not force full block rerender on each keystroke.
js = js.replaceAll(
  `oninput="document.getElementById('sun-dj').value=this.value;saveSunday()"`,
  `oninput="document.getElementById('sun-dj').value=this.value"`,
);

// Restore DJ roster CRUD behavior with stable in-place form typing.
js = js.replace(/\/\/ ── DJs ──[\s\S]*?\/\/ ── Anchors ──/m, `// ── DJs ──
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
    \`<tr>
      <td style="font-weight:500;">\${d.name || '—'}</td>
      <td style="color:var(--ink-mid);">\${d.genre || '—'}</td>
      <td style="color:var(--ink-light);">\${d.contact || '—'}</td>
      <td><span class="badge \${stCls[d.status] || 'bn'}">\${d.status || 'Prospect'}</span></td>
      <td style="color:var(--ink-light);">\${d.last || '—'}</td>
      <td style="white-space:nowrap;">
        <span onclick="editDJ(\${i})" style="cursor:pointer;color:var(--ink-light);font-size:13px;margin-right:8px;">Edit</span>
        <span onclick="removeDJ(\${i})" style="cursor:pointer;color:var(--ink-light);font-size:14px;">×</span>
      </td>
    </tr>\`).join('');
}

function removeDJ(i) {
  if (i < 0 || i >= S.djs.length) return;
  S.djs.splice(i, 1);
  if (djEditIndex === i) resetDJForm();
  else if (djEditIndex > i) djEditIndex -= 1;
  save('djs');
  renderDJs();
}

// ── Anchors ──`);

// Inline onclick handlers in the preserved HTML require functions on window.
const fnNames = [...new Set([...js.matchAll(/\bfunction\s+([A-Za-z0-9_]+)\s*\(/g)].map(m => m[1]))];
if (fnNames.length) {
  js += `\nif (typeof window !== 'undefined') {\n  Object.assign(window, { ${fnNames.join(', ')} });\n}\n`;
}

// HTML: auth gate + module entry
if (!html.includes('<body>')) throw new Error('Expected <body> in source HTML');
html = html.replace(
  '</style>',
  `/* ── Hideout Console web auth ── */
.hideout-auth-gate{position:fixed;inset:0;z-index:999999;background:rgba(247,246,239,0.97);display:flex;align-items:center;justify-content:center;padding:18px;font-family:inherit;}
.hideout-auth-gate.hideout-hidden{display:none !important;}
.hideout-auth-submit{margin-top:12px;width:100%;}
.hideout-auth-alt{margin-top:8px;width:100%;}
.hideout-auth-lbl{display:block;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-mid);}
.hideout-auth-input{width:100%;margin:10px 0;font-size:16px;padding:12px;border:1px solid var(--border-mid);border-radius:6px;background:var(--surface);color:var(--ink);font-family:inherit;box-sizing:border-box;}
/* Layout/CSS polish only: sidebar masking + continuous texture + global scale trim */
:root{--ui-scale:0.88;}
.shell{font-size:calc(100% * var(--ui-scale));}
.main{padding:2.15rem 2.85rem;}
.sidebar{
  width:18%;
  min-width:220px;
  max-width:320px;
  display:flex;
  flex-direction:column;
  overflow-y:auto;
  overflow-x:hidden;
  background-repeat:no-repeat;
  background-size:cover;
  background-position:center;
}
.sb-brand{
  position:sticky;
  top:0;
  z-index:5;
  background:transparent;
}
.sb-brand::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(to bottom, rgba(18,16,14,0.64) 0%, rgba(18,16,14,0.38) 55%, rgba(18,16,14,0) 100%);
  pointer-events:none;
  z-index:-1;
}
.sb-sec{flex:0 0 auto;}
.sb-foot{
  flex:0 0 auto;
  margin-top:0.7rem;
  padding-bottom:1rem;
  background:transparent;
  border-top:1px solid rgba(232,221,208,0.06);
}
.nb{font-size:14px;line-height:1.22;white-space:normal;word-break:break-word;}
/* remove filled nav blocks; use edge/glow/text-weight only */
.nb:hover{background:transparent !important;text-shadow:0 0 0.35px rgba(236,227,214,0.65);}
.nb.active{
  background:transparent !important;
  border-left:2px solid rgba(236,227,214,0.58);
  border-radius:0;
  padding-left:10px;
  font-weight:500;
  color:rgba(236,227,214,0.98);
  text-shadow:0 0 4px rgba(236,227,214,0.18);
}
/* quieter scrollbar */
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:rgba(109,97,84,0.30);border-radius:4px;}
::-webkit-scrollbar-track{background:transparent;}
</style>`,
);

html = html.replace(
  '<body>',
  `<body>
<div id="hideout-auth-gate" class="hideout-auth-gate hideout-hidden">
  <div class="hideout-auth-card card">
    <div class="ph-title" style="margin-bottom:6px;">Hideout Console</div>
    <p style="font-size:14px;color:var(--ink-mid);margin-bottom:10px;">Sign in with the email on the allow list for this workspace.</p>
    <label class="hideout-auth-lbl" for="auth-email">Email</label>
    <input type="email" id="auth-email" class="hideout-auth-input" autocomplete="email" placeholder="you@yourcafe.com"/>
    <label class="hideout-auth-lbl" for="auth-password">Password (optional fallback)</label>
    <input type="password" id="auth-password" class="hideout-auth-input" autocomplete="current-password" placeholder="Password"/>
    <button type="button" class="btn hideout-auth-submit" id="auth-magic">Send magic link</button>
    <button type="button" class="btn btn-o hideout-auth-alt" id="auth-password-login">Sign in</button>
    <p id="auth-msg" style="font-size:13px;color:var(--ink-light);margin-top:8px;"></p>
  </div>
</div>`,
);

html = html.replace(
  'Your data lives in your browser (localStorage). To save it permanently, export it weekly.',
  'Your data syncs to your signed-in account. Still export weekly as a backup.',
);

html = `${html}
<script type="module" src="/src/main.js"></script>
</body>
</html>`;

fs.writeFileSync(OUT_JS, js, 'utf8');
fs.writeFileSync(OUT_HTML, html + '\n', 'utf8');
console.log('Wrote', path.relative(ROOT, OUT_HTML), 'and', path.relative(ROOT, OUT_JS));
