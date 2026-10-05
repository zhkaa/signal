import { randomUUID } from 'node:crypto';

/** У каждого браузера своё временное хранилище; чужой ID нельзя выбрать вручную. */
export function demoSession() {
  const sessions = new Map();
  const lifetime = 24 * 60 * 60 * 1000;

  return (req, res, next) => {
    if (!req.app.locals.demo) return next();

    const now = Date.now();
    for (const [id, expiry] of sessions) {
      if (expiry < now) {
        sessions.delete(id);
        req.app.locals.demoProjects.delete(id);
      }
    }

    let id = req.headers.cookie?.match(/(?:^|; )signal_demo=([a-f0-9-]+)/)?.[1];
    if (!sessions.has(id)) id = randomUUID();

    // Cookie и серверный срок жизни продлеваются вместе при активности.
    res.cookie('signal_demo', id, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: lifetime,
    });
    sessions.set(id, now + lifetime);
    req.demoId = id;
    next();
  };
}
