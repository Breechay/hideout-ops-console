import { createClient } from '@supabase/supabase-js';
import * as Persist from './persist.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — set in .env for cloud sync.');
}

const sb = createClient(url || '', anon || '');
Persist.bindSupabase(sb);

function emptyS() {
  return {
    logs: [],
    checks: {},
    djs: [],
    anchors: [],
    notes: [],
    sunday: {},
    reviews: [],
    monthlies: [],
    decisions: [],
  };
}

/** Single shared object — console-app closes over this; never replace the reference after load. */
globalThis.__HIDEOUT_BOOT__ = { S: emptyS() };

function showAuth(show) {
  const g = document.getElementById('hideout-auth-gate');
  if (!g) return;
  if (show) g.classList.remove('hideout-hidden');
  else g.classList.add('hideout-hidden');
}

function wireMagicLink() {
  const emailEl = document.getElementById('auth-email');
  const passwordEl = document.getElementById('auth-password');
  const msgEl = document.getElementById('auth-msg');

  async function doPasswordLogin() {
    const email = emailEl?.value?.trim().toLowerCase();
    const password = passwordEl?.value || '';
    if (msgEl) msgEl.textContent = '';
    if (!email) { if (msgEl) msgEl.textContent = 'Enter your email.'; return; }
    if (!password) { if (msgEl) msgEl.textContent = 'Enter your password.'; return; }
    if (msgEl) msgEl.textContent = 'Signing in…';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { if (msgEl) msgEl.textContent = error.message; return; }
    if (msgEl) msgEl.textContent = 'Signed in.';
  }

  document.getElementById('auth-password-login')?.addEventListener('click', doPasswordLogin);

  // Enter key on either field triggers sign in
  [emailEl, passwordEl].forEach(el => {
    el?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doPasswordLogin();
    });
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') Persist.persistFlush().catch(() => {});
});

window.addEventListener('pagehide', () => {
  Persist.persistFlush().catch(() => {});
});

window.addEventListener('beforeunload', () => {
  Persist.persistFlush().catch(() => {});
});

async function boot() {
  wireMagicLink();

  let mounted = false;
  let mountInFlight = false;

  async function mountConsole(session) {
    if (!session?.user?.id || mounted || mountInFlight) return;
    mountInFlight = true;
    try {
      Persist.bindUser(session.user.id);
      try {
        await Persist.loadRemoteState();
      } catch (e) {
        console.error('Cloud load failed', e);
      }
      showAuth(false);
      await import('./console-app.js');
      mounted = true;
    } finally {
      mountInFlight = false;
    }
  }

  const { data: first } = await sb.auth.getSession();
  await mountConsole(first.session);

  if (!mounted) {
    showAuth(true);
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (session?.user?.id && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      await mountConsole(session);
    }
    if (event === 'SIGNED_OUT') {
      window.location.reload();
    }
  });
}

boot().catch(e => console.error('Hideout Console boot:', e));
