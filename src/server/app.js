import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { projectRoot, appOrigin } from './config.js';
import { handleError } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import toolRoutes from './routes/tools.js';
import systemRoutes from './routes/system.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();
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
      message: { code: 'RATE_LIMIT' },
    }),
  );
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.headers.origin !== appOrigin() || !req.is('application/json'))
        return res.status(403).json({ code: 'ORIGIN_REJECTED' });
    }
    next();
  });

  app.get('/vendor/alpine.js', (req, res) => {
    res.sendFile(projectRoot + 'node_modules/alpinejs/dist/module.esm.js');
  });
  app.get('/vendor/htmx.js', (req, res) => {
    res.sendFile(projectRoot + 'node_modules/htmx.org/dist/htmx.min.js');
  });
  app.use(express.static(projectRoot + 'public'));
  app.use(systemRoutes);
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 60000,
      limit: 15,
      skip: (req) => req.method === 'GET',
      message: { code: 'RATE_LIMIT' },
    }),
  );
  app.use('/api', authRoutes, projectRoutes, toolRoutes, adminRoutes);
  app.get(
    [
      '/auth/callback',
      '/auth/recovery',
      '/auth/email-callback',
      '/auth/confirm',
      '/email-confirmed',
    ],
    authRoutes,
  );
  app.use('/api', (req, res) => res.status(404).json({ code: 'NOT_FOUND' }));
  app.get(
    [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/resend-confirmation',
      '/app/:page',
    ],
    (req, res) => res.sendFile(projectRoot + 'public/index.html'),
  );
  app.use(handleError);
  return app;
}
