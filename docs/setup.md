# Подключение Signal

## 1. Supabase

В этой рабочей копии .env уже настроен на ваш проект `wppnnoginpzettowkwzw`. Публичный ключ не даёт прав создавать схемы или назначать администраторов.

Для нового проекта:

1. Создайте Supabase project.
2. Из Connect / API Keys скопируйте Project URL и publishable key в SUPABASE_URL и SUPABASE_PUBLISHABLE_KEY.
3. Выполните `npm run db:prepare`.
4. Откройте SQL Editor, вставьте supabase/setup.sql и нажмите Run **один раз на новой базе**.
5. В Authentication → URL Configuration задайте Site URL `http://localhost:3000` и разрешённые Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/recovery`
6. Email provider должен быть включён. Подтверждение почты можно оставить включённым.
7. Перезапустите `npm start`.

Для вашего проекта: [SQL Editor](https://supabase.com/dashboard/project/wppnnoginpzettowkwzw/sql/new), [Authentication](https://supabase.com/dashboard/project/wppnnoginpzettowkwzw/auth/users).

Зарегистрируйтесь через [локальную страницу](http://localhost:3000/register). Откройте письмо подтверждения в том же браузере. Если письмо открыто в другом браузере или проверочный cookie истёк, подтверждение email всё равно может пройти: затем войдите через email/пароль. Приложение хранит сессии в HttpOnly-cookie, а не в localStorage.

## 2. Google OAuth

Это отдельная настройка. Публичного ключа Supabase для Google недостаточно.

1. Откройте [Google Cloud Console](https://console.cloud.google.com/) и создайте/выберите проект.
2. В Google Auth Platform настройте Branding и Audience. Для Testing добавьте свой email в Test users.
3. Используйте scopes: openid, userinfo.email, userinfo.profile. Дополнительный доступ к каналу YouTube для входа не нужен.
4. Создайте OAuth client типа Web application.
5. Authorized JavaScript origins: `http://localhost:3000`.
6. Authorized redirect URIs:
   `https://wppnnoginpzettowkwzw.supabase.co/auth/v1/callback`.
7. В Supabase Authentication → Sign In / Providers → Google включите provider и вставьте Client ID и Client Secret **там**. Google secret не нужен в .env Signal и не должен попадать в чат или репозиторий.
8. Убедитесь, что локальный `/auth/callback` разрешён в URL Configuration, как в предыдущем разделе.
9. Подождите до 30 секунд и обновите страницу Signal. Кнопка Google станет доступной после проверки настроек.

[Официальная инструкция Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) · [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).

Вход по почте и Google используют одну систему пользователей Supabase. Приложение не включает опасное автоматическое объединение аккаунтов.

## 3. YouTube API

1. В Google Cloud включите YouTube Data API v3.
2. Создайте API key для серверных запросов и ограничьте его этим API. Browser/referrer-ограничение не подходит для серверных запросов; IP ограничивайте только при стабильном адресе сервера.
3. Запишите ключ в YOUTUBE_API_KEY локального .env и перезапустите npm start.
4. Выполните поиск ниш/каналов. Поиск расходует квоту; нишевой запрос делает несколько обращений.

Google OAuth Client Secret и YouTube API key — разные параметры.

## 4. Первый администратор

Сначала зарегистрируйте и подтвердите свой аккаунт. Затем выполните в Supabase SQL Editor, подставив свой email:

```sql
insert into public.user_roles(user_id, role)
select id, 'admin' from auth.users
where lower(email) = lower('YOUR_EMAIL')
on conflict (user_id) do update set role = excluded.role;
```

Проверьте число добавленных строк. Если 0 — аккаунт с таким email ещё не создан. Обновите Signal: в боковом меню появится админ-панель. Остальные пользователи не получают роль автоматически.

Не делайте такой INSERT из браузера или через publishable key. Права выдаёт владелец Supabase проекта; публичное API приложения не умеет назначать роли.

## 5. CLI необязателен

Для этого локального сайта хватает SQL Editor и npm start. Команды supabase login/init/link требуют Supabase CLI и входа в аккаунт, а не publishable key. Не запускайте db push поверх уже выполненного setup.sql без согласования истории миграций: это может повторно создать существующие таблицы.

## Статус этой рабочей копии

15 октября 2026: URL/key записаны в локальный .env; чтение app_settings подтверждено; анонимное чтение profiles отклонено сервером Supabase (401). Пользователь сообщил об успешном выполнении setup.sql. Google provider пока выключен. YouTube API key подключён, контрольный запрос videos.list вернул HTTP 200. Полная проверка двух пользователей/RLS и реального Google-входа остаётся отдельным шагом после настройки аккаунтов.

## Письмо подтверждения email

В Supabase Authentication → Email Templates → Confirm signup:

1. Subject: `Подтвердите вашу почту — Signal`.
2. Замените Body целиком содержимым `supabase/templates/confirm-signup.html` и сохраните.
3. В Authentication → URL Configuration укажите Site URL `http://localhost:3000` и добавьте Redirect URL `http://localhost:3000/auth/email-callback` (сохраните также callback/recovery для Google и восстановления).
4. Запросите новое письмо через `/resend-confirmation`, указав email регистрации. После успешной отправки кнопка блокируется на минуту; лимит Supabase показывается отдельным сообщением. Уже доставленные письма не изменяются.

Шаблон использует TokenHash и SiteURL по [документации Supabase](https://supabase.com/docs/guides/auth/auth-email-templates). Письмо локализуется по locale регистрации. Ссылка открывает страницу с кнопкой: только нажатие отправляет одноразовый токен на сервер. Это не даёт почтовому сканеру израсходовать ссылку простым GET. После verifyOtp сервер устанавливает HttpOnly-сессию. Страница `/email-confirmed` показывает успех только после проверки подтверждённого пользователя в Supabase. Токен удаляется из адресной строки; ответы не кешируются, Referrer-Policy — no-referrer. Повторное открытие использованной ссылки предлагает войти.

Локальные ссылки открывайте на этом компьютере при запущенном `npm start`. Для подтверждения с телефона или другого компьютера понадобится опубликованный адрес вместо localhost.

Шаблон подготовлен в репозитории, но ещё не сохранён в облачном Supabase: publishable key не разрешает менять Email Templates. Старый стандартный шаблон сможет использовать новый email-callback после настройки Redirect URL; для перехода между браузерами нужен новый шаблон с TokenHash.

YouTube API key добавлен в локальный .env, контрольный запрос videos.list вернул HTTP 200. Не копируйте ключ в HTML или клиентский JavaScript.
