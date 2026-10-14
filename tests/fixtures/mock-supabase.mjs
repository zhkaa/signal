// Isolated test double. Never imported by the application server.
import express from 'express';
import { randomUUID, createHash } from 'node:crypto';
export function mockSupabase() {
  const app = express();
  app.use(express.json());
  const state = {
    projects: [],
    events: [],
    settings: { id: 1, announcement_ru: '', announcement_en: '', version: 1 },
    calls: [],
    failNext: false,
    challenge: '',
  };
  const users = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'creator@example.test',
      user_metadata: { display_name: 'Test creator' },
      display_name: 'Test creator',
      created_at: '2026-10-14T12:00:00Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'admin@example.test',
      user_metadata: { display_name: 'Test admin' },
      display_name: 'Test admin',
      created_at: '2026-10-14T12:00:00Z',
    },
  ];
  const revoked = new Set();
  const usedConfirmations = new Set();
  const token = (user) =>
    [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }),
      ).toString('base64url'),
      Buffer.from('fixture-only').toString('base64url'),
    ].join('.');
  const session = (user) => ({
    access_token: token(user),
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'refresh-' + user.id,
    user,
  });
  const identity = (req) => {
    try {
      const raw = req.headers.authorization?.replace('Bearer ', '');
      if (revoked.has(raw)) return null;
      const claims = JSON.parse(Buffer.from(raw.split('.')[1], 'base64url'));
      return users.find((u) => u.id === claims.sub);
    } catch {
      return null;
    }
  };
  app.use((req, res, next) => {
    state.calls.push({ path: req.path, query: req.query, body: req.body, method: req.method });
    next();
  });
  app.post('/testing/fail-next', (req, res) => {
    state.failNext = true;
    res.json({ armed: true });
  });
  app.post('/auth/v1/token', (req, res) => {
    if (req.query.grant_type === 'pkce') {
      const verifier = req.body.code_verifier || '';
      if (
        !verifier ||
        !state.challenge ||
        createHash('sha256').update(verifier).digest('base64url') !== state.challenge
      )
        return res
          .status(400)
          .json({ error: 'invalid_grant', error_description: 'Invalid verifier' });
      return res.json(session(users[0]));
    }
    if (req.query.grant_type === 'refresh_token') {
      const user = users.find((u) => 'refresh-' + u.id === req.body.refresh_token);
      return user ? res.json(session(user)) : res.status(400).json({ error: 'invalid_grant' });
    }
    const user = users.find((u) => u.email === req.body.email);
    if (!user || req.body.password !== 'fixture-password')
      return res
        .status(400)
        .json({ error: 'invalid_grant', error_description: 'Invalid credentials' });
    revoked.delete(token(user));
    res.json(session(user));
  });
  app.post('/auth/v1/signup', (req, res) => {
    let user = users.find((u) => u.email === req.body.email);
    if (!user) {
      user = {
        id: randomUUID(),
        email: req.body.email,
        user_metadata: req.body.data,
        display_name: req.body.data?.display_name || '',
        created_at: new Date().toISOString(),
      };
      users.push(user);
    }
    res.json(session(user));
  });
  app.post('/auth/v1/verify', (req, res) => {
    const value = req.body.token_hash;
    if (
      !value?.startsWith('valid-confirmation-token-') ||
      usedConfirmations.has(value) ||
      req.body.type !== 'email'
    )
      return res.status(403).json({ msg: 'Token has expired', code: 'otp_expired' });
    usedConfirmations.add(value);
    users[0].email_confirmed_at = new Date().toISOString();
    revoked.delete(token(users[0]));
    res.json(session(users[0]));
  });
  app.get('/auth/v1/settings', (req, res) => res.json({ external: { google: true, email: true } }));
  app.get('/auth/v1/user', (req, res) => {
    const user = identity(req);
    return user ? res.json(user) : res.status(401).json({ msg: 'Invalid token' });
  });
  app.put('/auth/v1/user', (req, res) => {
    const user = identity(req);
    return user ? res.json(user) : res.status(401).json({ msg: 'Invalid token' });
  });
  app.post('/auth/v1/logout', (req, res) => {
    revoked.add(req.headers.authorization?.replace('Bearer ', ''));
    res.status(204).end();
  });
  app.post('/auth/v1/recover', (req, res) => res.json({}));
  app.post('/auth/v1/resend', (req, res) => {
    if (req.body.email === 'limited@example.test')
      return res
        .status(429)
        .json({ msg: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' });
    res.json({});
  });
  app.get('/auth/v1/authorize', (req, res) => {
    state.challenge = req.query.code_challenge;
    const target = new URL(req.query.redirect_to);
    target.searchParams.set('code', 'fixture-code');
    res.redirect(target.href);
  });
  app.all('/rest/v1/rpc/is_signal_admin', (req, res) =>
    res.json(identity(req)?.email === 'admin@example.test'),
  );
  app.use('/rest/v1', (req, res, next) => {
    if (state.failNext) {
      state.failNext = false;
      return res.status(500).json({ message: 'Fixture failure', code: 'TEST_FAILURE' });
    }
    next();
  });
  app.all('/rest/v1/app_settings', (req, res) => {
    if (req.method === 'PATCH') {
      const user = identity(req);
      if (user?.email !== 'admin@example.test')
        return res.status(403).json({ message: 'Forbidden' });
      if (req.query.version !== 'eq.' + state.settings.version) return res.json(null);
      state.settings = { ...state.settings, ...req.body };
      state.events.unshift({
        id: randomUUID(),
        actor_id: user.id,
        action: 'announcement_updated',
        created_at: new Date().toISOString(),
      });
    }
    res.json(state.settings);
  });
  const paged = (req, res, rows) => {
    const offset = Number(req.query.offset) || 0,
      limit = Number(req.query.limit) || 12;
    res.set(
      'Content-Range',
      `${offset}-${Math.min(offset + limit, rows.length) - 1}/${rows.length}`,
    );
    if (req.method === 'HEAD') return res.status(200).end();
    const sliced = rows.slice(offset, offset + limit);
    res.json(req.headers.accept?.includes('pgrst.object') ? sliced[0] || null : sliced);
  };
  app.all('/rest/v1/profiles', (req, res) => {
    const user = identity(req);
    if (!user) return res.sendStatus(401);
    const id = req.query.id?.slice(3);
    const rows = users.filter((u) =>
      id ? u.id === id : user.email === 'admin@example.test' || u.id === user.id,
    );
    if (req.method === 'PATCH') {
      if (id !== user.id) return res.sendStatus(403);
      user.display_name = req.body.display_name;
      return res.status(204).end();
    }
    paged(req, res, rows);
  });
  app.all('/rest/v1/projects', (req, res) => {
    const user = identity(req);
    if (!user) return res.sendStatus(401);
    if (req.method === 'POST') {
      if (req.body.user_id !== user.id) return res.sendStatus(403);
      const row = { ...req.body, id: randomUUID(), created_at: new Date().toISOString() };
      state.projects.unshift(row);
      return res.status(201).json(row);
    }
    const owner = req.query.user_id?.slice(3);
    const id = req.query.id?.slice(3);
    const rows = state.projects.filter(
      (p) =>
        (owner
          ? p.user_id === owner
          : user.email === 'admin@example.test' || p.user_id === user.id) &&
        (!id || p.id === id),
    );
    if (req.method === 'DELETE') {
      const allowed = rows.filter((p) => p.user_id === user.id);
      state.projects = state.projects.filter((p) => !allowed.includes(p));
      return res.json(allowed.map((p) => ({ id: p.id })));
    }
    paged(req, res, rows);
  });
  app.get('/rest/v1/admin_events', (req, res) => paged(req, res, state.events));
  return { app, state, users, token, session };
}
