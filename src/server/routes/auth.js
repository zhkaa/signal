import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { identify } from '../middleware/auth.js';
import { appOrigin } from '../config.js';
import { pkceClient, setSession, clearSession, cookies } from '../services/session.js';
import { providerSettings } from '../services/readiness.js';
import { confirmationPage } from '../services/confirmation-page.js';
const router = Router();
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!valid(email, password)) return res.status(400).json({ code: 'AUTH_VALIDATION' });
  const { data, error } = await supabase().auth.signInWithPassword({ email, password });
  if (error || !data.session) return res.status(400).json({ code: 'AUTH_FAILED' });
  setSession(res, data.session);
  res.json({ authenticated: true });
});
router.post('/auth/register', async (req, res) => {
  const { email, password, name = '' } = req.body || {};
  if (
    !valid(email, password) ||
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.length > 100
  )
    return res.status(400).json({ code: 'AUTH_VALIDATION' });
  const { data, error } = await pkceClient(req, res).auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name.trim(), locale: req.body.locale === 'en' ? 'en' : 'ru' },
      emailRedirectTo: appOrigin() + '/auth/email-callback',
    },
  });
  if (error) return res.status(400).json({ code: 'AUTH_FAILED' });
  if (data.session) setSession(res, data.session);
  res.json({ authenticated: Boolean(data.session), confirmationRequired: !data.session });
});
router.post('/auth/google', async (req, res) => {
  if (!(await providerSettings()).google)
    return res.status(503).json({ code: 'OAUTH_UNAVAILABLE' });
  const { data, error } = await pkceClient(req, res).auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: appOrigin() + '/auth/callback', skipBrowserRedirect: true },
  });
  if (error) return res.status(400).json({ code: 'OAUTH_FAILED' });
  res.json({ url: data.url });
});
router.post('/auth/resend', async (req, res) => {
  if (!validEmail(req.body?.email)) return res.status(400).json({ code: 'AUTH_VALIDATION' });
  const { error } = await pkceClient(req, res).auth.resend({
    type: 'signup',
    email: req.body.email,
    options: { emailRedirectTo: appOrigin() + '/auth/email-callback' },
  });
  if (error) {
    if (error.status === 429 || error.code === 'over_email_send_rate_limit')
      return res.status(429).json({ code: 'CONFIRMATION_RATE_LIMIT' });
    return res.status(502).json({ code: 'REQUEST_FAILED' });
  }
  res.json({ sent: true });
});
router.get('/auth/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code || code.length > 2048) return res.redirect('/login?oauth_error=1');
  try {
    const { data, error } = await pkceClient(req, res).auth.exchangeCodeForSession(code);
    if (error || !data.session) return res.redirect('/login?oauth_error=1');
    setSession(res, data.session);
    return res.redirect('/app/dashboard');
  } catch {
    return res.redirect('/login?oauth_error=1');
  }
});
router.get('/auth/email-callback', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code || code.length > 2048) return res.redirect('/auth/confirm');
    const { data, error } = await pkceClient(req, res).auth.exchangeCodeForSession(code);
    if (error || !data.session) return res.redirect('/auth/confirm');
    setSession(res, data.session);
    return res.redirect('/email-confirmed');
  } catch {
    return res.redirect('/auth/confirm');
  }
});
router.get('/auth/confirm', (req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  const validToken =
    typeof req.query.token_hash === 'string' &&
    /^[a-zA-Z0-9_-]{20,256}$/.test(req.query.token_hash);
  res.send(confirmationPage(validToken ? 'pending' : 'invalid', req.query.lang));
});
router.post('/auth/confirm', async (req, res) => {
  const token = req.body?.token_hash;
  if (typeof token !== 'string' || !/^[a-zA-Z0-9_-]{20,256}$/.test(token))
    return res.status(400).json({ code: 'CONFIRMATION_INVALID' });
  const { data, error } = await supabase().auth.verifyOtp({ token_hash: token, type: 'email' });
  if (error || !data.session || !data.user?.email_confirmed_at)
    return res.status(400).json({ code: 'CONFIRMATION_INVALID' });
  setSession(res, data.session);
  res.json({ confirmed: true });
});
router.get('/email-confirmed', async (req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  let confirmed = false;
  try {
    const token = cookies(req).signal_access;
    if (token) {
      const { data, error } = await supabase().auth.getUser(token);
      confirmed = !error && Boolean(data.user?.email_confirmed_at);
    }
  } catch {
    /* Render a recoverable state if the provider cannot be reached. */
  }
  res.send(confirmationPage(confirmed ? 'success' : 'invalid', req.query.lang));
});
router.post('/auth/recover', async (req, res) => {
  if (!validEmail(req.body?.email)) return res.status(400).json({ code: 'AUTH_VALIDATION' });
  const { error } = await pkceClient(req, res).auth.resetPasswordForEmail(req.body.email, {
    redirectTo: appOrigin() + '/auth/recovery',
  });
  if (error) return res.status(400).json({ code: 'AUTH_FAILED' });
  res.json({ sent: true });
});
router.get('/auth/recovery', async (req, res) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code || code.length > 2048) return res.redirect('/login?oauth_error=1');
    const { data, error } = await pkceClient(req, res).auth.exchangeCodeForSession(code);
    if (error || !data.session) return res.redirect('/login?oauth_error=1');
    setSession(res, data.session);
    res.redirect('/reset-password');
  } catch {
    res.redirect('/login?oauth_error=1');
  }
});
router.post('/auth/password', identify, async (req, res) => {
  if (
    typeof req.body?.password !== 'string' ||
    req.body.password.length < 8 ||
    req.body.password.length > 128
  )
    return res.status(400).json({ code: 'AUTH_VALIDATION' });
  const client = supabase();
  const { error: sessionError } = await client.auth.setSession({
    access_token: req.accessToken,
    refresh_token: cookies(req).signal_refresh,
  });
  if (sessionError) return res.status(401).json({ code: 'SESSION_REQUIRED' });
  const { error } = await client.auth.updateUser({ password: req.body.password });
  if (error) return res.status(400).json({ code: 'AUTH_FAILED' });
  await client.auth.signOut({ scope: 'local' });
  clearSession(res);
  res.json({ saved: true });
});
router.post('/auth/logout', identify, async (req, res) => {
  const { error } = await supabase().auth.admin.signOut(req.accessToken, 'local');
  if (error) return res.status(502).json({ code: 'REQUEST_FAILED' });
  clearSession(res);
  res.json({ signedOut: true });
});
router.get('/auth/me', identify, async (req, res) => {
  const [profile, role] = await Promise.all([
    req.db.from('profiles').select('display_name').eq('id', req.user.id).single(),
    req.db.rpc('is_signal_admin'),
  ]);
  res.json({
    id: req.user.id,
    email: req.user.email,
    name:
      profile.data?.display_name ||
      req.user.user_metadata?.display_name ||
      req.user.user_metadata?.full_name ||
      '',
    admin: role.data === true,
  });
});
router.patch('/auth/profile', identify, async (req, res) => {
  const name = req.body?.name;
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)
    return res.status(400).json({ code: 'PROFILE_VALIDATION' });
  const { error } = await req.db
    .from('profiles')
    .update({ display_name: name.trim() })
    .eq('id', req.user.id);
  if (error) return res.status(502).json({ code: 'DATABASE_FAILED' });
  res.json({ name: name.trim() });
});
function validEmail(email) {
  return (
    typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}
function valid(email, password) {
  return (
    validEmail(email) &&
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128
  );
}
export default router;
