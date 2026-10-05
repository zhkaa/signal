import { supabase } from '../services/supabase.js';
export async function identify(req, res, next) {
  if (req.app.locals.demo) {
    req.user = { id: req.demoId };
    return next();
  }
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Войдите в аккаунт, чтобы сохранять проекты.' });
  const { data, error } = await supabase().auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
  req.user = data.user;
  req.db = supabase(token);
  next();
}
