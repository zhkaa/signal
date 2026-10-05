window.SignalData = (() => {
  'use strict';
  // Explicitly fictional fixtures. Replace this data layer with an API adapter later.
  const niches = [
    {
      title: "Нейросети для повседневных задач",
      category: "Технологии",
      demand: 92,
      competition: 34,
      growth: "+28%",
      keywords: "ии искусственный интеллект нейросети технологии",
    },
    {
      title: "Английский через фильмы",
      category: "Образование",
      demand: 86,
      competition: 57,
      growth: "+16%",
      keywords: "образование английский язык фильмы учёба",
    },
    {
      title: "Готовим за 15 минут",
      category: "Лайфстайл",
      demand: 89,
      competition: 72,
      growth: "+12%",
      keywords: "еда готовка кухня рецепты лайфстайл",
    },
    {
      title: "Игры без дорогого компьютера",
      category: "Игры",
      demand: 78,
      competition: 52,
      growth: "+19%",
      keywords: "игры гейминг компьютер",
    },
    {
      title: "Домашние тренировки с нуля",
      category: "Лайфстайл",
      demand: 83,
      competition: 66,
      growth: "+14%",
      keywords: "спорт фитнес здоровье тренировки лайфстайл",
    },
    {
      title: "Простая наука вокруг нас",
      category: "Образование",
      demand: 75,
      competition: 31,
      growth: "+23%",
      keywords: "образование наука эксперименты",
    },
    {
      title: "Съёмка и монтаж на смартфон",
      category: "Технологии",
      demand: 81,
      competition: 43,
      growth: "+21%",
      keywords: "технологии видео монтаж телефон съёмка",
    },
    {
      title: "Уютный дом своими руками",
      category: "Лайфстайл",
      demand: 72,
      competition: 38,
      growth: "+17%",
      keywords: "дом интерьер уют дизайн лайфстайл",
    },
  ];
  const channels = [
    {
      name: "Просто о технологиях",
      handle: "@simpletech_demo",
      subscribers: 28400,
      views: 186200,
      engagement: 5.8,
      color: "#d5fb9c",
    },
    {
      name: "Цифровая мастерская",
      handle: "@digitalstudio_demo",
      subscribers: 15200,
      views: 97400,
      engagement: 7.2,
      color: "#dce6ff",
    },
    {
      name: "Техно с нуля",
      handle: "@technostart_demo",
      subscribers: 8300,
      views: 68100,
      engagement: 6.4,
      color: "#ffe6cb",
    },
  ];
  const formatNumber = (value) =>
    new Intl.NumberFormat("ru-RU").format(value);
  const ideaTemplates = {
    guide: [
      "{topic}: с чего начать, если вы новичок",
      "5 ошибок в теме «{topic}» и как их избежать",
      "{topic}: пошаговый план за 10 минут",
      "Всё, что я хотел знать про {topic} в начале",
    ],
    experiment: [
      "Я изучал {topic} 7 дней. Вот что получилось",
      "{topic} без бюджета: возможно ли это?",
      "Проверяю 3 популярных совета про {topic}",
      "Неделя с новым подходом к теме «{topic}»",
    ],
    shorts: [
      "«{topic}»: один полезный факт за 30 секунд",
      "Не делайте так: {topic} для новичков",
      "{topic}: до и после",
      "«{topic}»: ответ на главный вопрос за минуту",
    ],
  };

  return { niches, channels, formatNumber, ideaTemplates };
})();
