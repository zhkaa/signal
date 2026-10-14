# Архитектура Signal

Express раздаёт собранные локальные ресурсы и API. Alpine управляет URL-backed интерфейсом без смены стека на SPA-фреймворк.

## Клиент

views/index.html собирается с landing/auth/workspace. js/app.js владеет маршрутизацией, локалью, валидацией, состоянием запросов и общей обратной связью. features разделены на auth, optimizer, research и projects. CSS main.css использует canonical tokens.css. Локальные Lucide и Geologica создаются сборкой.

Public: /, /login, /register, /forgot-password. Reset требует сессии восстановления. Рабочие экраны: /app/dashboard, niches, optimizer, competitors, analytics, projects, settings и admin.

## Сервер

- middleware/auth.js проверяет Supabase getUser и обновляет истёкшую сессию.
- services/session.js хранит access/refresh/PKCE cookies с HttpOnly и SameSite=Lax.
- Все мутации API требуют Origin=APP_URL и application/json.
- auth.js выполняет регистрацию/вход/Google PKCE/recovery/logout/profile.
- projects.js ограничивает операции явным user_id даже для администраторов, а RLS обеспечивает дополнительную изоляцию.
- tools.js требует входа и вызывает реальный YouTube API или шаблонный оптимизатор.
- admin.js проверяет роль через серверную RPC и предоставляет сводку/объявления.
- readiness.js проверяет публичные настройки Google provider с коротким кешем.
- Ни service-role, ни database password не используются.

## База данных

Миграции 01–05 определяют profiles/projects, RLS, индексы и ограничения. 06 добавляет user_roles, проверку admin, app_settings, version concurrency и неизменяемые admin_events. Имя при регистрации копируется из auth metadata, но роль из metadata не читается.

supabase/setup.sql генерируется командой db:prepare; оригиналы остаются canonical. Миграции не выполняются при старте сервера.

## Сборка и проверка

Менять src, не public. npm start собирает HTML/CSS/JS/assets. npm test использует отдельный mock HTTP provider, который не импортируется сервером приложения. scripts/test-preview.mjs существует только для браузерной проверки. DESIGN.md и UX-CONTRACT.md фиксируют визуальные и поведенческие решения.
