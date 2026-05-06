/** Persistence layer — keeps S mutations in sync with Supabase tables. */

let sb = null;
let uid = null;

const DEBOUNCE_MS = 450;
const DEBOUNCE_APP_MS = 80;
const DEV = Boolean(import.meta?.env?.DEV);

/** @type {ReturnType<typeof setTimeout>|null} */
let tLogs = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let tReviews = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let tMonthlies = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let tApp = null;

/** today lever mirrors former localStorage behavior */
export let tl = {
  value: '',
  manual: '0',
  day: '',
};

export function bindSupabase(client) {
  sb = client;
}

export function bindUser(userId) {
  uid = userId;
}

export function resetTimers() {
  [tLogs, tReviews, tMonthlies, tApp].forEach(t => {
    if (t) clearTimeout(t);
  });
  tLogs = tReviews = tMonthlies = tApp = null;
}

export function hydrateTodayLever(fromState) {
  const x = fromState?.todayLever;
  tl = {
    value: x?.value ?? '',
    manual: x?.manual ?? '0',
    day: x?.day ?? '',
  };
}

export function getTodayLever() {
  return { ...tl };
}

export function setTodayLever(patch) {
  if (patch.value !== undefined && patch.value !== null) tl.value = String(patch.value);
  if (patch.manual !== undefined) tl.manual = String(patch.manual);
  if (patch.dayKey !== null && patch.dayKey !== undefined) tl.day = String(patch.dayKey);
}

function requireSb() {
  if (!sb || !uid) throw new Error('Not signed in');
}

function devLog(...args) {
  if (DEV) console.debug('[hideout:persist]', ...args);
}

function snapshotAppStateFragment() {
  const S = globalThis.__HIDEOUT_BOOT__.S;
  return {
    checks: S.checks,
    djs: S.djs,
    anchors: S.anchors,
    notes: S.notes,
    sunday: S.sunday,
    decisions: S.decisions,
    ui: S.ui || {},
    todayLever: { value: tl.value, manual: tl.manual, day: tl.day },
  };
}

function normalizeDJEntry(d) {
  if (typeof d === 'string') {
    return { name: d, genre: '', contact: '', status: 'Prospect', last: '' };
  }
  if (!d || typeof d !== 'object') {
    return { name: '', genre: '', contact: '', status: 'Prospect', last: '' };
  }
  const name = d.name ?? d.handle ?? d.dj ?? '';
  return {
    name: String(name || ''),
    genre: String(d.genre || ''),
    contact: String(d.contact || ''),
    status: String(d.status || 'Prospect'),
    last: String(d.last || d.lastPlayed || ''),
  };
}

async function persistLogsNow() {
  requireSb();
  const S = globalThis.__HIDEOUT_BOOT__.S;
  devLog('persist logs start', S.logs?.length || 0);
  await sb.from('daily_logs').delete().eq('user_id', uid);
  if (!S.logs?.length) return;
  const rows = S.logs.map(e => ({
    user_id: uid,
    logged_at: e.loggedAt,
    entry: { ...e },
  }));
  const chunk = 30;
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await sb.from('daily_logs').insert(rows.slice(i, i + chunk));
    if (error) throw error;
  }
}

async function persistReviewsNow() {
  requireSb();
  const S = globalThis.__HIDEOUT_BOOT__.S;
  devLog('persist reviews start', S.reviews?.length || 0);
  await sb.from('weekly_reviews').delete().eq('user_id', uid);
  if (!S.reviews?.length) return;
  const rows = S.reviews.map(r => ({
    user_id: uid,
    week_label: r.week,
    saved_at: r.savedAt,
    entry: { ...r },
  }));
  const { error } = await sb.from('weekly_reviews').insert(rows);
  if (error) throw error;
}

async function persistMonthliesNow() {
  requireSb();
  const S = globalThis.__HIDEOUT_BOOT__.S;
  devLog('persist monthlies start', S.monthlies?.length || 0);
  await sb.from('monthly_reviews').delete().eq('user_id', uid);
  if (!S.monthlies?.length) return;
  const rows = S.monthlies.map(m => ({
    user_id: uid,
    month_label: m.month,
    saved_at: m.savedAt,
    entry: { ...m },
  }));
  const { error } = await sb.from('monthly_reviews').insert(rows);
  if (error) throw error;
}

async function persistAppNow() {
  requireSb();
  const state = snapshotAppStateFragment();
  devLog('persist app_state start', {
    checks: Object.keys(state.checks || {}).length,
    djs: state.djs?.length || 0,
    anchors: state.anchors?.length || 0,
    notes: state.notes?.length || 0,
    decisions: state.decisions?.length || 0,
  });
  const { error } = await sb.from('app_state').upsert(
    { user_id: uid, state, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

function scheduleLogs() {
  if (tLogs) clearTimeout(tLogs);
  tLogs = setTimeout(() => {
    tLogs = null;
    persistLogsNow().catch(e => console.error('persist logs', e));
  }, DEBOUNCE_MS);
}

function scheduleReviews() {
  if (tReviews) clearTimeout(tReviews);
  tReviews = setTimeout(() => {
    tReviews = null;
    persistReviewsNow().catch(e => console.error('persist reviews', e));
  }, DEBOUNCE_MS);
}

function scheduleMonthlies() {
  if (tMonthlies) clearTimeout(tMonthlies);
  tMonthlies = setTimeout(() => {
    tMonthlies = null;
    persistMonthliesNow().catch(e => console.error('persist monthlies', e));
  }, DEBOUNCE_MS);
}

function scheduleApp() {
  if (tApp) clearTimeout(tApp);
  tApp = setTimeout(() => {
    tApp = null;
    persistAppNow().catch(e => console.error('persist app_state', e));
  }, DEBOUNCE_APP_MS);
}

export function persistKey(k) {
  devLog('save key', k);
  if (k === 'logs') scheduleLogs();
  else if (k === 'reviews') scheduleReviews();
  else if (k === 'monthlies') scheduleMonthlies();
  else scheduleApp();
}

export async function persistFlush() {
  if (tLogs) {
    clearTimeout(tLogs);
    tLogs = null;
    await persistLogsNow();
  }
  if (tReviews) {
    clearTimeout(tReviews);
    tReviews = null;
    await persistReviewsNow();
  }
  if (tMonthlies) {
    clearTimeout(tMonthlies);
    tMonthlies = null;
    await persistMonthliesNow();
  }
  if (tApp) {
    clearTimeout(tApp);
    tApp = null;
    await persistAppNow();
  }
}

/** Full overwrite after bulk import — no debounce races. */
export async function persistImportMerge() {
  await persistFlush();
  await persistLogsNow();
  await persistReviewsNow();
  await persistMonthliesNow();
  await persistAppNow();
}

async function fetchAllIntoS() {
  requireSb();
  const S = globalThis.__HIDEOUT_BOOT__.S;

  const [logsRes, revRes, monRes, appRes] = await Promise.all([
    sb.from('daily_logs').select('logged_at, entry').eq('user_id', uid).order('logged_at', { ascending: false }),
    sb.from('weekly_reviews').select('saved_at, entry').eq('user_id', uid).order('saved_at', { ascending: false }),
    sb.from('monthly_reviews').select('saved_at, entry').eq('user_id', uid).order('saved_at', { ascending: false }),
    sb.from('app_state').select('state').eq('user_id', uid).maybeSingle(),
  ]);

  if (logsRes.error) throw logsRes.error;
  if (revRes.error) throw revRes.error;
  if (monRes.error) throw monRes.error;
  if (appRes.error) throw appRes.error;

  const logsRows = logsRes.data || [];
  const revRows = revRes.data || [];
  const monRows = monRes.data || [];

  S.logs = logsRows.map(r => ({
    ...(r.entry || {}),
    loggedAt: r.logged_at != null ? Number(r.logged_at) : Number((r.entry && r.entry.loggedAt) || 0),
  }));

  function revSort(a, b) {
    const ta = a.savedAt || 0;
    const tb = b.savedAt || 0;
    return tb - ta;
  }

  S.reviews = revRows
    .map(r => ({
      ...(r.entry || {}),
      savedAt: r.saved_at != null ? Number(r.saved_at) : Number(r.entry?.savedAt || 0),
    }))
    .sort(revSort);

  S.monthlies = monRows
    .map(r => ({
      ...(r.entry || {}),
      savedAt: r.saved_at != null ? Number(r.saved_at) : Number(r.entry?.savedAt || 0),
    }))
    .sort(revSort);

  const st = appRes.data?.state || {};
  S.checks = st.checks || {};
  S.djs = Array.isArray(st.djs) ? st.djs.map(normalizeDJEntry).filter(x => x.name) : [];
  S.anchors = st.anchors || [];
  S.notes = st.notes || [];
  S.sunday = st.sunday || {};
  S.decisions = st.decisions || [];
  S.ui = (st.ui && typeof st.ui === 'object') ? st.ui : {};
  hydrateTodayLever(st);
}

export async function loadRemoteState() {
  await fetchAllIntoS();
  devLog('load remote state done');
}
