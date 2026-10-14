import { Router } from 'express';
import { optimize } from '../services/optimizer.js';
import { channels, niches } from '../services/youtube.js';
import { identify } from '../middleware/auth.js';
const router = Router();
router.use(['/optimize', '/channels', '/niches'], identify);
router.post('/optimize', (req, res) => {
  try {
    res.json(optimize(req.body || {}));
  } catch (error) {
    res.status(400).json({ code: 'TOPIC_VALIDATION' });
  }
});
const search = (handler) => async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2 || q.length > 100) return res.status(400).json({ code: 'QUERY_VALIDATION' });
  res.json({ items: await handler(q, req.query.locale === 'en' ? 'en' : 'ru') });
};
router.get('/channels', search(channels));
router.get('/niches', search(niches));

export default router;
