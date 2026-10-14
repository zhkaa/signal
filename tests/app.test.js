import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.js';
import { optimize } from '../src/server/services/optimizer.js';
import { mockSupabase } from './fixtures/mock-supabase.mjs';
import { translate, copy } from '../src/client/js/lib/i18n.js';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const fixture = mockSupabase();
let provider, server, base;
const previous = Object.fromEntries(
  ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'YOUTUBE_API_KEY', 'APP_URL'].map((k) => [
    k,
    process.env[k],
  ]),
);
before(async () => {
  provider = fixture.app.listen(0, '127.0.0.1');
  await new Promise((r) => provider.once('listening', r));
  process.env.SUPABASE_URL = 'http://127.0.0.1:' + provider.address().port;
  process.env.SUPABASE_ANON_KEY = 'fixture-anon';
  process.env.APP_URL = 'http://localhost:3000';
  delete process.env.YOUTUBE_API_KEY;
});
beforeEach(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = 'http://127.0.0.1:' + server.address().port;
  fixture.state.projects = [];
  fixture.state.calls = [];
  fixture.state.failNext = false;
});
afterEach(() => new Promise((r) => server.close(r)));
after(async () => {
  await new Promise((r) => provider.close(r));
  for (const [k, v] of Object.entries(previous)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});
const headers = (cookie = '') => ({
  'Content-Type': 'application/json',
  Origin: 'http://localhost:3000',
  ...(cookie ? { Cookie: cookie } : {}),
});
const cookieFor = (index = 0) => 'signal_access=' + fixture.token(fixture.users[index]);
const extractCookies = (r) =>
  r.headers
    .getSetCookie()
    .map((x) => x.split(';')[0])
    .join('; ');
test('resend validates requests, keeps redirect on this site and reports provider rate limits', async () => {
  const invalid = await json('/api/auth/resend', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: 'invalid' }),
  });
  assert.equal(invalid.response.status, 400);
  const result = await json('/api/auth/resend', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: 'creator@example.test' }),
  });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.data, { sent: true });
  const call = fixture.state.calls.find((call) => call.path === '/auth/v1/resend');
  assert.equal(call.body.type, 'signup');
  assert.equal(call.query.redirect_to, 'http://localhost:3000/auth/email-callback');
  const limited = await json('/api/auth/resend', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: 'limited@example.test' }),
  });
  assert.equal(limited.response.status, 429);
  assert.equal(limited.data.code, 'CONFIRMATION_RATE_LIMIT');
  const cross = await json('/api/auth/resend', {
    method: 'POST',
    headers: { ...headers(), Origin: 'https://other.example' },
    body: JSON.stringify({ email: 'creator@example.test' }),
  });
  assert.equal(cross.response.status, 403);
});
test('confirmation still redirects after success when preference storage is blocked', async () => {
  const source = (
    await readFile(new URL('../src/client/js/confirmation.js', import.meta.url), 'utf8')
  ).replace("import { request } from './lib/api.js';", '');
  const handlers = {};
  const form = {
    addEventListener: (name, handler) => {
      handlers[name] = handler;
    },
    setAttribute() {},
  };
  const button = {
    disabled: false,
    textContent: 'Confirm email',
    dataset: { working: 'Confirming', failure: 'Invalid', retry: 'Retry' },
  };
  const error = { hidden: true, setAttribute() {}, focus() {} };
  const elements = {
    'confirmation-form': form,
    'confirm-email': button,
    'confirmation-error': error,
  };
  let redirected, posted;
  runInNewContext(source, {
    URLSearchParams,
    document: { documentElement: { lang: 'en' }, getElementById: (id) => elements[id] },
    location: {
      search: '?token_hash=valid-confirmation-token-browser',
      pathname: '/auth/confirm',
      replace: (url) => {
        redirected = url;
      },
    },
    history: { replaceState() {} },
    localStorage: {
      setItem() {
        throw new Error('Storage disabled');
      },
    },
    request: async (url, options) => {
      posted = JSON.parse(options.body);
      return { confirmed: true };
    },
  });
  await handlers.submit({ preventDefault() {}, currentTarget: form });
  assert.equal(posted.token_hash, 'valid-confirmation-token-browser');
  assert.equal(redirected, '/email-confirmed?lang=en');
  assert.equal(error.hidden, true);
});
async function json(path, options = {}) {
  const response = await fetch(base + path, options);
  return { response, data: await response.json() };
}
test('optimizer validates input, supports all kinds and localized results', () => {
  assert.throws(() => optimize({ topic: 'x' }));
  assert.throws(() => optimize({ topic: 'test', kind: 'unknown' }));
  for (const kind of ['video', 'channel', 'stream'])
    for (const locale of ['ru', 'en']) {
      const result = optimize({ topic: 'Mobile filming', kind, locale });
      assert.equal(result.titles.length, 3);
      assert.equal(result.checklist.length, 4);
      assert.equal(result.locale, locale);
    }
  assert.match(optimize({ topic: 'Filming', locale: 'en' }).titles[0], /practical guide/);
});
test('landing, deep routes, local icons and Geologica load without server sources', async () => {
  for (const path of [
    '/',
    '/login',
    '/register',
    '/app/dashboard',
    '/app/admin',
    '/css/fonts.css',
    '/assets/icons.svg',
    '/assets/signal-discovery.png',
  ])
    assert.equal((await fetch(base + path)).status, 200, path);
  const html = await (await fetch(base)).text();
  assert.ok(!html.includes('<!-- include:'));
  assert.ok(!html.includes('Деморежим'));
  const fonts = await (await fetch(base + '/css/fonts.css')).text();
  assert.match(fonts, /Geologica/);
  for (const path of ['/.env', '/src/server/config.js', '/auth/login'])
    assert.equal((await fetch(base + path)).status, 404);
});
test('no demo access: every private API rejects anonymous requests', async () => {
  for (const path of [
    '/api/projects',
    '/api/channels?q=video',
    '/api/niches?q=video',
    '/api/admin/overview',
    '/api/auth/me',
  ])
    assert.equal((await fetch(base + path)).status, 401, path);
  assert.equal(
    (
      await fetch(base + '/api/optimize', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ topic: 'Example' }),
      })
    ).status,
    401,
  );
});
test('mutations reject cross-origin and missing Origin before touching provider', async () => {
  for (const origin of [undefined, 'https://untrusted.example']) {
    const h = { 'Content-Type': 'application/json' };
    if (origin) h.Origin = origin;
    assert.equal(
      (
        await fetch(base + '/api/auth/login', {
          method: 'POST',
          headers: h,
          body: JSON.stringify({ email: 'creator@example.test', password: 'fixture-password' }),
        })
      ).status,
      403,
    );
  }
  assert.equal(fixture.state.calls.length, 0);
});
test('credentials set HttpOnly cookies and never return tokens to JavaScript', async () => {
  const { response, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: 'creator@example.test', password: 'fixture-password' }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(data, { authenticated: true });
  assert.ok(
    response.headers
      .getSetCookie()
      .every((c) => c.includes('HttpOnly') && c.includes('SameSite=Lax')),
  );
  assert.equal(
    (await json('/api/auth/me', { headers: headers(extractCookies(response)) })).data.email,
    'creator@example.test',
  );
});
test('refresh cookie restores identity and revoked access rejects', async () => {
  const r = await fetch(base + '/api/auth/me', {
    headers: headers('signal_refresh=refresh-' + fixture.users[0].id),
  });
  assert.equal(r.status, 200);
  assert.ok(r.headers.getSetCookie().some((c) => c.startsWith('signal_access=')));
  const invalid = await fetch(base + '/api/auth/me', { headers: headers('signal_access=invalid') });
  assert.equal(invalid.status, 401);
  assert.ok(invalid.headers.getSetCookie().some((c) => c.includes('Max-Age=0')));
});
test('projects persist, paginate and enforce owner filters including admins', async () => {
  const h = headers(cookieFor());
  let first;
  for (let i = 0; i < 13; i++) {
    const { response, data } = await json('/api/projects', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ topic: 'Video topic ' + i, locale: 'en' }),
    });
    assert.equal(response.status, 201);
    first ||= data;
  }
  const page1 = (await json('/api/projects', { headers: h })).data;
  assert.equal(page1.items.length, 12);
  assert.equal(page1.total, 13);
  assert.equal((await json('/api/projects?page=2', { headers: h })).data.items.length, 1);
  assert.equal((await json('/api/projects', { headers: headers(cookieFor(1)) })).data.total, 0);
  const queries = fixture.state.calls.filter(
    (c) => c.path === '/rest/v1/projects' && c.method === 'GET',
  );
  assert.ok(queries.every((c) => c.query.user_id?.startsWith('eq.')));
  assert.equal(
    (
      await fetch(base + '/api/projects/' + first.id, {
        method: 'DELETE',
        headers: headers(cookieFor(1)),
        body: '{}',
      })
    ).status,
    404,
  );
  assert.equal(
    (await fetch(base + '/api/projects/' + first.id, { method: 'DELETE', headers: h, body: '{}' }))
      .status,
    204,
  );
  assert.equal((await json('/api/projects', { headers: h })).data.total, 12);
});
test('DB failures remain errors and preserve saved rows for retry', async () => {
  const h = headers(cookieFor());
  const { data } = await json('/api/projects', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ topic: 'Keep this project' }),
  });
  fixture.state.failNext = true;
  const failed = await fetch(base + '/api/projects/' + data.id, {
    method: 'DELETE',
    headers: h,
    body: '{}',
  });
  assert.equal(failed.status, 502);
  assert.equal(fixture.state.projects.length, 1);
  const retry = await fetch(base + '/api/projects/' + data.id, {
    method: 'DELETE',
    headers: h,
    body: '{}',
  });
  assert.equal(retry.status, 204);
});
test('normal users cannot enter admin or change announcement', async () => {
  const h = headers(cookieFor());
  assert.equal((await fetch(base + '/api/admin/overview', { headers: h })).status, 403);
  assert.equal(
    (
      await fetch(base + '/api/admin/settings', {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ announcement_ru: 'test', announcement_en: 'test', version: 1 }),
      })
    ).status,
    403,
  );
});
test('admin announcement is audited and rejects stale versions', async () => {
  const h = headers(cookieFor(1));
  const overview = await json('/api/admin/overview', { headers: h });
  assert.equal(overview.response.status, 200);
  const version = overview.data.settings.version;
  const body = JSON.stringify({
    announcement_ru: 'Новый текст',
    announcement_en: 'New copy',
    version,
  });
  assert.equal(
    (await fetch(base + '/api/admin/settings', { method: 'PATCH', headers: h, body })).status,
    200,
  );
  assert.equal(
    (await fetch(base + '/api/admin/settings', { method: 'PATCH', headers: h, body })).status,
    409,
  );
  assert.equal(fixture.state.events[0].actor_id, fixture.users[1].id);
  assert.equal((await json('/api/config')).data.announcement.announcement_en, 'New copy');
});
test('Google uses PKCE challenge and callback requires matching HttpOnly verifier', async () => {
  const start = await json('/api/auth/google', { method: 'POST', headers: headers(), body: '{}' });
  assert.equal(start.response.status, 200);
  const url = new URL(start.data.url);
  assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  assert.ok(url.searchParams.get('code_challenge'));
  const cookie = extractCookies(start.response);
  assert.match(cookie, /signal_pkce=/);
  await fetch(start.data.url, { redirect: 'manual' });
  const rejected = await fetch(base + '/auth/callback?code=fixture-code', { redirect: 'manual' });
  assert.equal(rejected.headers.get('location'), '/login?oauth_error=1');
  const success = await fetch(base + '/auth/callback?code=fixture-code', {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  assert.equal(success.headers.get('location'), '/app/dashboard');
  assert.match(extractCookies(success), /signal_access=/);
});
test('missing external services produce honest setup states', async () => {
  assert.equal((await json('/api/config')).data.youtube, false);
  assert.equal(
    (await fetch(base + '/api/channels?q=video', { headers: headers(cookieFor()) })).status,
    503,
  );
  assert.equal(
    (await fetch(base + '/api/channels?q=x', { headers: headers(cookieFor()) })).status,
    400,
  );
  const saved = process.env.SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  try {
    assert.equal((await json('/api/config')).data.auth, false);
    assert.equal(
      (
        await fetch(base + '/api/auth/login', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ email: 'creator@example.test', password: 'fixture-password' }),
        })
      ).status,
      503,
    );
  } finally {
    process.env.SUPABASE_URL = saved;
  }
});
test('profile edit and signout clear cookies and revoke the current session', async () => {
  const login = await json('/api/auth/login', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: 'creator@example.test', password: 'fixture-password' }),
  });
  const h = headers(extractCookies(login.response));
  assert.equal(
    (
      await fetch(base + '/api/auth/profile', {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ name: 'Updated creator' }),
      })
    ).status,
    200,
  );
  assert.equal((await json('/api/auth/me', { headers: h })).data.name, 'Updated creator');
  const logout = await fetch(base + '/api/auth/logout', { method: 'POST', headers: h, body: '{}' });
  assert.equal(logout.status, 200);
  assert.ok(logout.headers.getSetCookie().every((c) => c.includes('Max-Age=0')));
  assert.equal((await fetch(base + '/api/auth/me', { headers: h })).status, 401);
});
test('all static translation references exist in RU and EN', async () => {
  const { readFile } = await import('node:fs/promises');
  const files = ['index', 'pages/landing', 'pages/auth', 'pages/workspace'];
  for (const file of files) {
    const html = await readFile('src/client/views/' + file + '.html', 'utf8');
    for (const match of html.matchAll(/t\('([^']+)'\)/g)) {
      assert.ok(copy[match[1]]?.[0], match[1]);
      assert.ok(copy[match[1]]?.[1], match[1]);
    }
  }
});

test('confirmation GET does not consume tokens and fake success URLs do not confirm email', async () => {
  const response = await fetch(base + '/auth/confirm?token_hash=valid-confirmation-token-safe');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(await response.text(), /confirmation-form/);
  assert.ok(!fixture.state.calls.some((x) => x.path === '/auth/v1/verify'));
  const fake = await fetch(base + '/email-confirmed?confirmed=true');
  assert.match(await fake.text(), /data-state="invalid"/);
  const invalid = await fetch(base + '/auth/confirm?token_hash=%3Cscript%3E');
  assert.match(await invalid.text(), /data-state="invalid"/);
});

test('email confirmation works without PKCE cookie, establishes session and rejects reused token', async () => {
  const body = JSON.stringify({ token_hash: 'valid-confirmation-token-complete' });
  const response = await fetch(base + '/api/auth/confirm', {
    method: 'POST',
    headers: headers(),
    body,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { confirmed: true });
  const cookie = extractCookies(response);
  assert.ok(cookie.includes('signal_access='));
  const page = await fetch(base + '/email-confirmed?lang=en', { headers: { Cookie: cookie } });
  assert.match(await page.text(), /Email confirmed/);
  const reused = await fetch(base + '/api/auth/confirm', {
    method: 'POST',
    headers: headers(),
    body,
  });
  assert.equal(reused.status, 400);
  assert.equal((await reused.json()).code, 'CONFIRMATION_INVALID');
  assert.equal(reused.headers.getSetCookie().length, 0);
});

test('confirmation rejects malformed tokens and cross-origin submissions', async () => {
  const response = await fetch(base + '/api/auth/confirm', {
    method: 'POST',
    headers: headers(),
    body: '{"token_hash":"bad"}',
  });
  assert.equal(response.status, 400);
  const cross = await fetch(base + '/api/auth/confirm', {
    method: 'POST',
    headers: { ...headers(), Origin: 'https://other.example' },
    body: '{}',
  });
  assert.equal(cross.status, 403);
});
