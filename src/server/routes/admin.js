import { Router } from 'express';
import { identify, requireAdmin } from '../middleware/auth.js';
import { authReady } from '../config.js';
const router = Router();
router.use('/admin', identify, requireAdmin);
router.get('/admin/overview', async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page) || 1));
  const results = await Promise.all([
    req.db
      .from('profiles')
      .select('id,display_name,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * 12, page * 12 - 1),
    req.db.from('projects').select('id', { head: true, count: 'exact' }),
    req.db.from('app_settings').select('*').eq('id', 1).single(),
    req.db
      .from('admin_events')
      .select('id,actor_id,action,created_at')
      .order('created_at', { ascending: false })
      .limit(12),
  ]);
  if (results.some((result) => result.error))
    return res.status(502).json({ code: 'DATABASE_FAILED' });
  res.json({
    users: results[0].data,
    userCount: results[0].count,
    projectCount: results[1].count,
    settings: results[2].data,
    events: results[3].data,
    page,
    integrations: { auth: authReady(), youtube: Boolean(process.env.YOUTUBE_API_KEY) },
  });
});
router.patch('/admin/settings', async (req, res) => {
  const { announcement_ru, announcement_en, version } = req.body || {};
  if (
    [announcement_ru, announcement_en].some(
      (value) => typeof value !== 'string' || value.length > 300,
    ) ||
    !Number.isInteger(version)
  )
    return res.status(400).json({ code: 'SETTINGS_VALIDATION' });
  const { data, error } = await req.db
    .from('app_settings')
    .update({
      announcement_ru: announcement_ru.trim(),
      announcement_en: announcement_en.trim(),
      version: version + 1,
    })
    .eq('id', 1)
    .eq('version', version)
    .select()
    .maybeSingle();
  if (error) return res.status(502).json({ code: 'DATABASE_FAILED' });
  if (!data) return res.status(409).json({ code: 'CONFLICT' });
  res.json(data);
});
export default router;
