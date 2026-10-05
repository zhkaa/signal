import { Router } from 'express';

const router = Router();
router.get('/api/config', (req, res) => {
  res.json({ demo: req.app.locals.demo, company: 'Obsidia' });
});
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demo: req.app.locals.demo });
});

// HTMX получает готовый HTML, Alpine управляет интерактивными формами.
router.get('/fragments/status', (req, res) => {
  const label = req.app.locals.demo
    ? 'Деморежим · данные для знакомства'
    : 'YouTube API · реальный режим';
  res.send(`<span class="status-dot"></span>${label}`);
});
export default router;
