import { supabase } from '../services/supabase.js';
import { cookies, setSession, clearSession } from '../services/session.js';
export async function identify(req, res, next) {
  const jar = cookies(req);
  let token = jar.signal_access;
  if (!token && !jar.signal_refresh) return res.status(401).json({ code: 'SESSION_REQUIRED' });
  const client = supabase();
  let data = token ? (await client.auth.getUser(token)).data : null;
  if (!data?.user && jar.signal_refresh) {
    const refreshed = await client.auth.refreshSession({ refresh_token: jar.signal_refresh });
    if (refreshed.data.session) {
      setSession(res, refreshed.data.session);
      token = refreshed.data.session.access_token;
      data = (await client.auth.getUser(token)).data;
    }
  }
  if (!data?.user) {
    clearSession(res);
    return res.status(401).json({ code: 'SESSION_REQUIRED' });
  }
  req.user = data.user;
  req.accessToken = token;
  req.db = supabase(token);
  res.set('Cache-Control', 'no-store');
  next();
}
export async function requireAdmin(req, res, next) {
  const { data, error } = await req.db.rpc('is_signal_admin');
  if (error || data !== true) return res.status(403).json({ code: 'ADMIN_REQUIRED' });
  next();
}
