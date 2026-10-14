import { fileURLToPath } from 'node:url';
export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const supabaseKey = () =>
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
export const authReady = () => Boolean(process.env.SUPABASE_URL && supabaseKey());
export const appOrigin = () => new URL(process.env.APP_URL || 'http://localhost:3000').origin;
