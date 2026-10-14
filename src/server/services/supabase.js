import { createClient } from '@supabase/supabase-js';
import { authReady, supabaseKey } from '../config.js';
export function supabase(token) {
  if (!authReady())
    throw Object.assign(new Error('Auth unavailable'), { status: 503, code: 'AUTH_UNAVAILABLE' });
  return createClient(process.env.SUPABASE_URL, supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch: (url, options = {}) =>
        fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(15000) }),
    },
  });
}
