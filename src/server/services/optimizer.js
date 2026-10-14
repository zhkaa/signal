export function optimize(input) {
  const topic = String(input.topic || '').trim();
  const kind = input.kind || 'video';
  const locale = input.locale === 'en' ? 'en' : 'ru';
  if (topic.length < 3 || topic.length > 160) throw new Error('Invalid topic');
  if (!['video', 'channel', 'stream'].includes(kind)) throw new Error('Invalid content type');
  const audience = String(input.audience || (locale === 'en' ? 'new creators' : 'начинающих'))
    .trim()
    .slice(0, 100);
  const en = locale === 'en';
  const tags = [
    ...new Set([
      topic.toLowerCase(),
      ...topic
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3),
      ...(en ? ['tutorial', 'practice', 'guide'] : ['обучение', 'практика', 'гайд']),
    ]),
  ].slice(0, 12);
  const titles =
    kind === 'channel'
      ? en
        ? [`${topic} • Simply explained`, `${topic} from scratch`, `${topic} | In practice`]
        : [`${topic} • Просто о главном`, `${topic} с нуля`, `${topic} | Практика`]
      : en
        ? [
            `${topic}: a practical guide for ${audience}`,
            `Understanding ${topic}: 5 steps`,
            `${topic} — mistakes you can avoid`,
          ]
        : [
            `${topic}: понятный гайд для ${audience}`,
            `Как разобраться в теме «${topic}»: 5 шагов`,
            `${topic} — ошибки, которые легко исправить`,
          ];
  const description =
    kind === 'channel'
      ? en
        ? `A channel about ${topic} for ${audience}. Clear explanations, practical examples and new ideas. Subscribe to learn together!`
        : `Канал о теме «${topic}». Материалы для ${audience}. Понятные объяснения, практические примеры и новые идеи. Подпишитесь, чтобы учиться вместе!`
      : en
        ? `Explore ${topic} for ${audience}: where to start, how to apply it and what to avoid.\n\nIn this episode:\n• Key concepts\n• A practical example\n• Questions and answers\n\nSubscribe and share your experience in the comments.`
        : `Разбираем тему «${topic}» для ${audience}: с чего начать, как применить на практике и каких ошибок избежать.\n\nВ этом выпуске:\n• Основные понятия\n• Практический пример\n• Ответы на вопросы\n\nПодпишитесь на канал и поделитесь своим опытом в комментариях.`;
  const checklists = {
    stream: en
      ? [
          'Start with H.264, AAC, 1080p / 30 fps',
          'Check upload speed and run a test stream',
          'Add the start time and chat rules',
          'Set the bitrate for your platform and connection',
        ]
      : [
          'Базовый профиль: H.264, AAC, 1080p / 30 fps',
          'Проверьте исходящую скорость и тестовую трансляцию',
          'Добавьте время старта и правила чата',
          'Подберите битрейт по требованиям платформы и соединению',
        ],
    channel: en
      ? [
          'Check the availability of your name and @handle',
          'Add a banner, avatar and links',
          'Choose channel language and country',
          'Set your audience and moderation preferences',
        ]
      : [
          'Проверьте доступность названия и @handle',
          'Добавьте баннер, аватар и ссылки',
          'Выберите язык и страну канала',
          'Укажите аудиторию и настройте модерацию',
        ],
    video: en
      ? [
          'Put the main topic at the start of the title',
          'Upload a thumbnail with readable text',
          'Add actual timestamps after editing',
          'Check captions and the end screen',
        ]
      : [
          'Главная тема — в начале заголовка',
          'Загрузите обложку с читаемым текстом',
          'Добавьте реальные таймкоды после монтажа',
          'Проверьте субтитры и конечную заставку',
        ],
  };
  return { kind, topic, audience, locale, titles, tags, description, checklist: checklists[kind] };
}
