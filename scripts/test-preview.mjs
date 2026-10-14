// Browser QA only: separate port, disposable test accounts and isolated memory.
import { mockSupabase } from '../tests/fixtures/mock-supabase.mjs';
const fixture = mockSupabase();
const provider = fixture.app.listen(3101, '127.0.0.1');
await new Promise((resolve) => provider.once('listening', resolve));
process.env.SUPABASE_URL = 'http://127.0.0.1:3101';
process.env.SUPABASE_ANON_KEY = 'fixture-anon';
process.env.APP_URL = 'http://localhost:3100';
delete process.env.YOUTUBE_API_KEY;
const { createApp } = await import('../src/server/app.js');
const server = createApp().listen(3100, '127.0.0.1', () =>
  console.log(
    'Isolated browser QA: http://localhost:3100. Test accounts: creator@example.test / admin@example.test, password: fixture-password. This is not a real Supabase connection.',
  ),
);
process.on('SIGINT', () => {
  server.close();
  provider.close();
});
