// These pages never infer confirmation from query parameters: success is server-verified.
export function confirmationPage(state, language) {
  const en = language === 'en';
  const locale = en ? 'en' : 'ru';
  const strings = en
    ? {
        pending: [
          'One step to Signal',
          'Confirm your email to save projects and start researching your next video.',
          'Confirm email',
        ],
        success: [
          'Email confirmed',
          'Your account is ready. Find your next topic, study competitors and prepare your publication.',
          'Open dashboard',
        ],
        invalid: [
          'Check your confirmation link',
          'This link may have expired or already been used. Sign in if you have already confirmed your email, or request a new confirmation link.',
          'Sign in',
        ],
        home: 'Back to home',
        note: 'Your next step on YouTube.',
        working: 'Confirming…',
        failure: 'Could not confirm this email. The link may have expired or already been used.',
        retry: 'Connection failed. Check your connection and try again.',
        register: 'Request a new email',
      }
    : {
        pending: [
          'Один шаг до Signal',
          'Подтвердите почту, чтобы сохранять проекты и находить идеи для следующего видео.',
          'Подтвердить email',
        ],
        success: [
          'Email подтверждён',
          'Ваш аккаунт готов. Находите темы, изучайте конкурентов и готовьте публикации в своём рабочем пространстве.',
          'Открыть рабочее пространство',
        ],
        invalid: [
          'Проверьте ссылку из письма',
          'Ссылка могла устареть или уже использоваться. Если вы подтвердили почту раньше, войдите в аккаунт. Иначе запросите новое письмо подтверждения.',
          'Войти в аккаунт',
        ],
        home: 'На главную',
        note: 'Ваш следующий шаг на YouTube.',
        working: 'Подтверждаем…',
        failure: 'Не удалось подтвердить email. Ссылка могла устареть или уже использоваться.',
        retry: 'Нет ответа от сервера. Проверьте подключение и попробуйте ещё раз.',
        register: 'Запросить новое письмо',
      };
  const [title, description, action] = strings[state];
  return `<!doctype html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — Signal</title><link rel="icon" href="/assets/signal-logo.svg"><link rel="stylesheet" href="/css/main.css"><script type="module" src="/js/confirmation.js"></script></head>
  <body class="confirmation-page" data-state="${state}"><header class="auth-header"><a class="brand" href="/">signal<span class="brand-dot">.</span></a><button class="language-button" id="confirmation-language" type="button" aria-label="${en ? 'Switch to Russian' : 'Переключить на английский'}">${locale.toUpperCase()}</button></header>
  <main class="confirmation-card"><div class="confirmation-symbol ${state}" aria-hidden="true"><svg class="icon"><use href="/assets/icons.svg#${state === 'success' ? 'check' : state === 'pending' ? 'mail' : 'info'}"></use></svg></div><p class="eyebrow">SIGNAL / ${en ? 'YOUR ACCOUNT' : 'ВАШ АККАУНТ'}</p><h1>${title}</h1><p class="confirmation-copy">${description}</p>
  <p class="feedback error" id="confirmation-error" role="alert" hidden></p>
  ${state === 'pending' ? `<form id="confirmation-form" novalidate><button class="button full-width" id="confirm-email" data-working="${strings.working}" data-failure="${strings.failure}" data-retry="${strings.retry}">${action}</button></form><noscript><p>JavaScript ${en ? 'is required to confirm your email.' : 'нужен для подтверждения почты.'}</p></noscript>` : `<a class="button full-width" href="${state === 'success' ? '/app/dashboard' : '/login'}">${action}<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#arrow-right"></use></svg></a>`}
  ${state === 'invalid' ? `<a class="confirmation-secondary" href="/resend-confirmation">${strings.register}</a>` : ''}
  <a class="confirmation-secondary" href="/">${strings.home}</a></main><footer class="confirmation-footer">${strings.note}</footer></body></html>`;
}
