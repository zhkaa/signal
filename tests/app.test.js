import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.js';
import { optimize } from '../src/server/services/optimizer.js';
let server, base;
before(async () => {
  server = createApp({ demo: true }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
test('optimizer validates input and supports three distinct content types', () => {
  assert.throws(() => optimize({ topic: 'a' }));
  assert.throws(() => optimize({ topic: 'test', kind: 'wrong' }));
  for (const kind of ['video', 'channel', 'stream']) {
    const result = optimize({ topic: 'Мобильная съёмка', kind });
    assert.equal(result.kind, kind);
    assert.equal(result.titles.length, 3);
    assert.ok(result.checklist.length);
  }
});
test('health, local assets and HTMX fragment are available', async () => {
  for (const path of [
    '/',
    '/vendor/alpine.js',
    '/vendor/htmx.js',
    '/assets/signal-logo.svg',
    '/assets/icons.svg',
    '/assets/fonts/manrope-cyrillic-wght-normal.woff2',
    '/css/main.css',
    '/css/fonts.css',
    '/js/app.js',
    '/js/features/projects.js',
    '/fragments/status',
  ]) {
    const r = await fetch(base + path);
    assert.equal(r.status, 200, path);
  }
  assert.equal((await (await fetch(base + '/api/health')).json()).demo, true);
});

test('build resolves HTML components without exposing server sources', async () => {
  const html = await (await fetch(base)).text();
  assert.ok(!html.includes('<!-- include:'));
  assert.ok(html.includes('/js/app.js'));
  assert.equal((await fetch(base + '/src/server/config.js')).status, 404);
  assert.equal((await fetch(base + '/.env')).status, 404);
});
test('projects persist within one demo session and are isolated from another', async () => {
  const first = await fetch(base + '/api/config');
  const cookie = first.headers.get('set-cookie').split(';')[0];
  const headers = { 'Content-Type': 'application/json', Cookie: cookie };
  const added = await fetch(base + '/api/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify({ topic: 'Тестовая тема', kind: 'video' }),
  });
  assert.equal(added.status, 201);
  const row = await added.json();
  assert.equal((await (await fetch(base + '/api/projects', { headers })).json()).length, 1);
  assert.equal((await (await fetch(base + '/api/projects')).json()).length, 0);
  await fetch(base + '/api/projects/' + row.id, { method: 'DELETE' });
  assert.equal((await (await fetch(base + '/api/projects', { headers })).json()).length, 1);
  assert.equal(
    (await fetch(base + '/api/projects/' + row.id, { method: 'DELETE', headers })).status,
    204,
  );
  assert.equal((await (await fetch(base + '/api/projects', { headers })).json()).length, 0);
});
test('search validates queries and labels fixtures', async () => {
  assert.equal((await fetch(base + '/api/channels?q=x')).status, 400);
  for (const type of ['channels', 'niches']) {
    const data = await (await fetch(base + `/api/${type}?q=video`)).json();
    assert.equal(data.demo, true);
    assert.ok(data.items.length);
  }
});
test('invalid JSON, invalid project and missing route have appropriate status', async () => {
  const headers = { 'Content-Type': 'application/json' };
  assert.equal(
    (await fetch(base + '/api/optimize', { method: 'POST', headers, body: '{' })).status,
    400,
  );
  assert.equal(
    (await fetch(base + '/api/projects', { method: 'POST', headers, body: '{}' })).status,
    400,
  );
  assert.equal((await fetch(base + '/api/missing')).status, 404);
});
test('live mode fails closed without credentials', () => {
  const prev = process.env.SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  try {
    assert.throws(() => createApp({ demo: false }), /ключи/);
  } finally {
    if (prev !== undefined) process.env.SUPABASE_URL = prev;
  }
});
