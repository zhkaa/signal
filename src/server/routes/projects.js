import { Router } from 'express';
import { identify } from '../middleware/auth.js';
import { projects } from '../services/projects.js';
import { optimize } from '../services/optimizer.js';
const router = Router();

// Middleware проверяет пользователя до чтения или изменения проектов.
router.use('/projects', identify);
router.get('/projects', async (req, res) => {
  res.json(await projects(req, 'list'));
});
router.post('/projects', async (req, res) => {
  let result;
  try {
    result = optimize(req.body || {});
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const project = await projects(req, 'create', {
    title: result.topic,
    kind: result.kind,
    content: result,
  });
  res.status(201).json(project);
});
router.delete('/projects/:id', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Некорректный ID проекта.' });
  }
  await projects(req, 'delete', req.params.id);
  res.status(204).end();
});

export default router;
