import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { projectRoot, validateEnvironment } from './config.js';
import { demoSession } from './middleware/demo-session.js';
import { handleError } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import toolRoutes from './routes/tools.js';
import systemRoutes from './routes/system.js';

export function createApp({ demo = process.env.DEMO_MODE !== 'false' } = {}) {
  validateEnvironment(demo);
  const app = express();
  app.locals.demo = demo;
  app.locals.demoProjects = new Map();
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Alpine использует вычисление выражений из HTML-атрибутов.
          'script-src': ["'self'", "'unsafe-eval'"],
          'img-src': ["'self'", 'data:'],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Слишком много запросов. Попробуйте через минуту.' },
    }),
  );
  app.use(demoSession());

  app.get('/vendor/alpine.js', (req, res) => {
    res.sendFile(projectRoot + 'node_modules/alpinejs/dist/module.esm.js');
  });
  app.get('/vendor/htmx.js', (req, res) => {
    res.sendFile(projectRoot + 'node_modules/htmx.org/dist/htmx.min.js');
  });
  app.use(express.static(projectRoot + 'public'));
  app.use(systemRoutes);
  app.use('/api', authRoutes, projectRoutes, toolRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Маршрут не найден.' }));
  app.use(handleError);
  return app;
}
