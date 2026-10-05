import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { supabase } from '../services/supabase.js';
const router = Router();
router.post('/auth/:action', rateLimit({ windowMs: 60000, limit: 10 }), async (req, res) => {
  if (req.app.locals.demo)
    return res.status(400).json({ error: 'Деморежим уже доступен без регистрации.' });
  if (!['login', 'register'].includes(req.params.action)) return res.sendStatus(404);
  const { email, password } = req.body || {};
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.length > 254 ||
    password.length < 8 ||
    password.length > 128
  )
    return res.status(400).json({ error: 'Укажите email и пароль от 8 до 128 символов.' });
  const client = supabase();
  const { data, error } =
    req.params.action === 'login'
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({ email, password });
  if (error)
    return res.status(400).json({
      error: 'Не удалось войти или зарегистрироваться. Проверьте данные и подтверждение email.',
    });
  res.json({
    token: data.session?.access_token,
    email: data.user?.email,
    message: data.session ? 'Вы вошли в аккаунт.' : 'Проверьте почту для подтверждения аккаунта.',
  });
});

export default router;
