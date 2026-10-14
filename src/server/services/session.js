import { createClient } from '@supabase/supabase-js';
import { appOrigin, authReady, supabaseKey } from '../config.js';
export function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '').split(';').map((item) => {
      const index = item.indexOf('=');
      if (index < 0) return ['', ''];
      try {
        return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1))];
      } catch {
        return ['', ''];
      }
    }),
  );
}
export function cookie(res, name, value, seconds) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: appOrigin().startsWith('https:'),
    sameSite: 'lax',
    path: '/',
    maxAge: seconds * 1000,
  });
}
export function setSession(res, session) {
  cookie(res, 'signal_access', session.access_token, session.expires_in || 3600);
  cookie(res, 'signal_refresh', session.refresh_token, 60 * 60 * 24 * 30);
}
export function clearSession(res) {
  for (const name of ['signal_access', 'signal_refresh', 'signal_pkce']) cookie(res, name, '', 0);
}
// PKCE verifier is server-owned. Auth tokens never reach browser JavaScript.
export function pkceClient(req, res) {
  if (!authReady())
    throw Object.assign(new Error('Auth unavailable'), { status: 503, code: 'AUTH_UNAVAILABLE' });
  const jar = cookies(req);
  const values = new Map();
  return createClient(process.env.SUPABASE_URL, supabaseKey(), {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem(key) {
          return key.endsWith('-code-verifier') ? jar.signal_pkce || null : values.get(key) || null;
        },
        setItem(key, value) {
          if (key.endsWith('-code-verifier')) {
            jar.signal_pkce = value;
            cookie(res, 'signal_pkce', value, 3600);
          } else values.set(key, value);
        },
        removeItem(key) {
          if (key.endsWith('-code-verifier')) cookie(res, 'signal_pkce', '', 0);
          else values.delete(key);
        },
      },
    },
    global: {
      fetch: (url, options = {}) =>
        fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(15000) }),
    },
  });
}
