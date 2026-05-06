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
  document.getElementById('auth-magic')?.addEventListener('click', async () => {
    const email = emailEl?.value?.trim().toLowerCase();
    if (msgEl) msgEl.textContent = '';
    if (!email) {
      if (msgEl) msgEl.textContent = 'Enter your email.';
      return;
    }
    const redirect = `${window.location.origin}${window.location.pathname}`;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) {
      if (msgEl) msgEl.textContent = error.message;
      return;
    }
    if (msgEl) msgEl.textContent = 'Check email for your sign-in link.';
  });

  document.getElementById('auth-password-login')?.addEventListener('click', async () => {
    const email = emailEl?.value?.trim().toLowerCase();
    const password = passwordEl?.value || '';
    if (msgEl) msgEl.textContent = '';
    if (!email) {
      if (msgEl) msgEl.textContent = 'Enter your email.';
      return;
    }
    if (!password) {
      if (msgEl) msgEl.textContent = 'Enter your password to use password sign-in.';
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (msgEl) msgEl.textContent = error.message;
      return;
    }
    if (msgEl) msgEl.textContent = 'Signed in.';
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
