import { Router } from 'express';
import { optimize } from '../services/optimizer.js';
import { channels, niches } from '../services/youtube.js';
const router = Router();
router.post('/optimize', (req, res) => {
  try {
    res.json(optimize(req.body || {}));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
const search = (handler) => async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2 || q.length > 100)
    return res.status(400).json({ error: 'Введите запрос от 2 до 100 символов.' });
  res.json({ demo: req.app.locals.demo, items: await handler(q, req.app.locals.demo) });
};
router.get('/channels', search(channels));
router.get('/niches', search(niches));

export default router;
