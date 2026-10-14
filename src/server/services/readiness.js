import { authReady, supabaseKey } from '../config.js';
let cached = null;
export async function providerSettings() {
  if (!authReady()) return { google: false, email: false };
  const url = process.env.SUPABASE_URL;
  if (cached?.url === url && Date.now() - cached.at < 30000) return cached.value;
  try {
    const response = await fetch(url + '/auth/v1/settings', {
      headers: { apikey: supabaseKey() },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { google: false, email: false };
    const settings = await response.json();
    const value = {
      google: settings.external?.google === true,
      email: settings.external?.email === true,
    };
    cached = { url, at: Date.now(), value };
    return value;
  } catch {
    return { google: false, email: false };
  }
}
