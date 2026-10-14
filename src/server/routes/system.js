import { Router } from 'express';
import { authReady } from '../config.js';
import { supabase } from '../services/supabase.js';
import { providerSettings } from '../services/readiness.js';
const router = Router();
router.get('/api/config', async (req, res) => {
  let announcement = null;
  if (authReady()) {
    try {
      const { data } = await supabase()
        .from('app_settings')
        .select('announcement_ru,announcement_en,version')
        .eq('id', 1)
        .single();
      announcement = data;
    } catch {}
  }
  const providers = await providerSettings();
  res.json({
    auth: authReady(),
    google: providers.google,
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    announcement,
  });
});
router.get('/api/health', (req, res) =>
  res.json({ status: 'ok', auth: authReady(), youtube: Boolean(process.env.YOUTUBE_API_KEY) }),
);
export default router;
