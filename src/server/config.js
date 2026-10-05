import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export function validateEnvironment(demo) {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'YOUTUBE_API_KEY'];
  if (!demo && required.some((key) => !process.env[key])) {
    throw new Error('Для DEMO_MODE=false нужны ключи Supabase и YouTube в .env.');
  }
}
