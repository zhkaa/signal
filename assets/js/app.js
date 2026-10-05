(() => {
  'use strict';
  const { getSession, beginDemo, escapeHTML: e, notify } = window.Signal;
  const { niches, channels, ideaTemplates, formatNumber: number } = window.SignalData;
  const isDemo = new URLSearchParams(location.search).get("demo") === "1";
  if (isDemo && !getSession()) beginDemo();
  const session = getSession();
  if (!session && !isDemo) location.replace("login.html");
  const name = session?.name || "Автор";
  document.querySelector("#account-name").textContent = name;
  document.querySelector("#avatar").textContent = name[0].toUpperCase();
  document.querySelector("#logout").addEventListener("click", () => {
    try {
      sessionStorage.removeItem("signal-demo-session");
    } catch {
      /* Storage may be disabled. */
    }
    location.assign("login.html");
  });
  const main = document.querySelector("#workspace-content");
  const titles = {
    overview: "Обзор",
    niches: "Поиск ниш",
    optimize: "Оптимизация",
    competitors: "Конкуренты",
    ideas: "Идеи для видео",
    analytics: "Статистика канала",
  };
  const state = {
    category: "Все темы",
    query: "",
    order: "demand",
    optimizeMode: "video",
    topic: "",
    selectedChannels: [0, 1],
    ideas: [],
    savedIdeas: new Set(),
    period: "28",
  };
  const banner =
    '<div class="info-banner"><span aria-hidden="true">ⓘ</span><span>Демонстрационные данные. Значения приведены для примера и не являются аналитикой YouTube.</span></div>';
  const heading = (title, description, extra = "") =>
    `<div class="page-heading"><div><span class="section-kicker">ВАШ НАБОР АВТОРА</span><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;
  const chart = (period = "28") => {
    const paths = {
      7: "0,165 70,150 140,159 210,95 280,116 350,49 430,23 500,10",
      28: "0,175 30,160 62,166 95,133 125,146 157,119 190,128 220,87 251,102 283,61 315,77 345,40 377,52 410,19 440,34 470,9 500,16",
      90: "0,185 40,170 80,175 120,144 160,152 200,125 240,113 280,119 320,80 360,86 400,55 440,62 470,20 500,8",
    };
    return `<svg class="chart" viewBox="0 0 500 210" preserveAspectRatio="none" role="img" aria-label="Пример динамики просмотров за ${period} дней"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#53ba6c" stop-opacity=".2"/><stop offset="1" stop-color="#53ba6c" stop-opacity="0"/></linearGradient></defs><path d="M0 35H500M0 90H500M0 145H500M0 200H500" stroke="#edf0ed"/><polygon points="0,210 ${paths[period]} 500,210" fill="url(#chart-fill)"/><polyline points="${paths[period]}" stroke="#38aa59" stroke-width="3" fill="none" stroke-linejoin="round"/></svg><div class="chart-labels"><span>Начало периода</span><span>Середина</span><span>Конец периода</span></div>`;
  };
  const metrics = (period = "28") => {
    const sets = {
      7: ["6 180", "+64", "284 ч", "4,8%"],
      28: ["24 890", "+204", "1 140 ч", "5,2%"],
      90: ["71 420", "+612", "3 265 ч", "5,7%"],
    };
    return `<div class="metric-grid">${["Просмотры", "Новые подписчики", "Время просмотра", "CTR обложек"].map((label, i) => `<article class="metric-card"><small>${label}</small><strong>${sets[period][i]}</strong><em>Пример за ${period} дней</em></article>`).join("")}</div>`;
  };
  function overview() {
    main.innerHTML =
      heading(
        `Всё начинается с вас, ${e(name)}`,
        "Один шаг сегодня — ещё ближе к своему каналу.",
      ) +
      banner +
      `<section class="welcome-panel"><div><span class="section-kicker">ВАШ СЛЕДУЮЩИЙ ШАГ</span><h2>Найдите тему, которая зажигает.</h2><p>Изучите ниши и выберите направление для первого видео.</p></div><a href="#niches" class="button button-dark">Найти свою нишу ↗</a></section>` +
      metrics() +
      `<div class="content-columns"><section class="panel"><div class="panel-title"><h2>Вас замечают</h2><a href="#analytics">Вся статистика ↗</a></div>${chart()}</section><section class="panel"><div class="panel-title"><h2>С чего начать</h2><small>3 простых шага</small></div><ol class="task-list"><li><a href="#niches"><span>01</span><div>Выберите направление<small>Найдите баланс интереса и спроса</small></div><span>↗</span></a></li><li><a href="#ideas"><span>02</span><div>Придумайте первое видео<small>От темы к конкретной идее</small></div><span>↗</span></a></li><li><a href="#optimize"><span>03</span><div>Подготовьте публикацию<small>Название, описание и теги</small></div><span>↗</span></a></li></ol></section></div><div class="app-tools">${[
        ["niches", "⌕", "Поиск ниш", "Найдите своё"],
        ["optimize", "✧", "Оптимизация", "Будьте заметнее"],
        ["competitors", "▥", "Конкуренты", "Учитесь у лучших"],
        ["ideas", "☼", "Идеи для видео", "Есть что рассказать"],
        ["analytics", "↗", "Статистика", "Замечайте свой рост"],
      ]
        .map(
          ([route, icon, title, description]) =>
            `<a href="#${route}" class="app-tool"><span>${icon}</span><b>${title}</b><small>${description}</small></a>`,
        )
        .join("")}</div>`;
  }
  function nichesPage() {
    main.innerHTML =
      heading(
        "Найдите свою нишу",
        "Выберите направление, в котором встретятся ваши интересы и интерес зрителей.",
      ) +
      banner +
      `<form class="search-controls" id="niche-search"><div class="field"><label for="niche-query">Какая тема вам интересна?</label><input id="niche-query" name="query" placeholder="Например, технологии или готовка" value="${e(state.query)}" maxlength="100"></div><button class="button button-dark" type="submit">Найти нишу ⌕</button></form><div class="filter-pills" aria-label="Категории">${["Все темы", "Технологии", "Образование", "Лайфстайл", "Игры"].map((c) => `<button type="button" data-category="${c}" aria-pressed="${state.category === c}">${c}</button>`).join("")}</div><div class="panel-title"><p class="results-caption" id="result-count" role="status"></p><div><label class="sr-only" for="niche-sort">Сортировать ниши</label><select class="period-select" id="niche-sort"><option value="demand">По спросу</option><option value="competition">Меньше конкуренции</option></select></div></div><div id="niche-results" class="niche-grid"></div>`;
    document.querySelector("#niche-sort").value = state.order;
    document
      .querySelector("#niche-search")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        state.query = document.querySelector("#niche-query").value.trim();
        renderNiches();
      });
    document.querySelector("#niche-sort").addEventListener("change", (event) => {
      state.order = event.target.value;
      renderNiches();
    });
    main.querySelectorAll("[data-category]").forEach((button) =>
      button.addEventListener("click", () => {
        state.category = button.dataset.category;
        main
          .querySelectorAll("[data-category]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        renderNiches();
      }),
    );
    renderNiches();
  }
  function renderNiches() {
    const query = state.query.toLocaleLowerCase("ru");
    const rows = niches
      .filter(
        (n) =>
          (state.category === "Все темы" || n.category === state.category) &&
          `${n.title} ${n.keywords}`.toLocaleLowerCase("ru").includes(query),
      )
      .sort((a, b) =>
        state.order === "competition"
          ? a.competition - b.competition
          : b.demand - a.demand,
      );
    document.querySelector("#result-count").textContent =
      `Найдено направлений: ${rows.length} · Каталог примеров`;
    document.querySelector("#niche-results").innerHTML = rows.length
      ? rows
          .map(
            (n) =>
              `<article class="niche-result"><span class="category">${n.category}</span><h3>${n.title}</h3><div class="data-bar"><div><span>Интерес зрителей</span><b>${n.demand} / 100</b></div><progress value="${n.demand}" max="100" aria-label="Интерес зрителей"></progress></div><div class="data-bar competition"><div><span>Конкуренция</span><b>${n.competition} / 100</b></div><progress value="${n.competition}" max="100" aria-label="Конкуренция"></progress></div><p class="growth">↗ ${n.growth} · Пример динамики спроса</p><button type="button" class="button button-outline" data-niche="${e(n.title)}">Найти идеи для этой ниши ↗</button></article>`,
          )
          .join("")
      : '<div class="empty-state"><h3>Такой темы пока нет в демо</h3><p>Попробуйте «технологии», «игры» или выберите другую категорию.</p></div>';
    main.querySelectorAll("[data-niche]").forEach((b) =>
      b.addEventListener("click", () => {
        state.topic = b.dataset.niche;
        location.hash = "ideas";
      }),
    );
  }
  function optimizePage() {
    main.innerHTML =
      heading(
        "Пусть ваш контент найдут",
        "Подготовьте название, описание и теги — в одном месте.",
      ) +
      `<div class="info-banner">ⓘ Это шаблонный помощник, без ИИ и данных YouTube. Проверьте и дополните текст перед публикацией.</div><div class="editor-layout"><section class="panel"><div class="segment-control" aria-label="Что оптимизировать"><button data-mode="video" aria-pressed="${state.optimizeMode === "video"}">Видео</button><button data-mode="channel" aria-pressed="${state.optimizeMode === "channel"}">Канал</button></div><form id="optimize-form"><div class="field"><label for="content-topic">${state.optimizeMode === "video" ? "О чём ваше видео?" : "Тематика вашего канала"}</label><input id="content-topic" name="topic" placeholder="Например, монтаж видео на телефоне" required maxlength="100" value="${e(state.topic)}"></div><div class="field"><label for="audience">Для кого вы создаёте контент?</label><select id="audience" name="audience"><option>Для новичков</option><option>Для широкой аудитории</option><option>Для опытных зрителей</option></select></div><div class="field"><label for="keywords">Ключевые слова</label><input id="keywords" name="keywords" placeholder="монтаж, смартфон, видео" maxlength="250"><small class="helper-text">Через запятую. Необязательно.</small></div><button class="button button-green full-width" type="submit">Подготовить текст ✧</button></form></section><section class="panel" id="optimization-output" aria-live="polite"><div class="output-placeholder"><span>✧</span><h3>Здесь будет ваш черновик</h3><p>Расскажите о контенте, и Signal предложит основу для публикации.</p></div></section></div>`;
    main.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        state.topic = document.querySelector("#content-topic").value;
        state.optimizeMode = b.dataset.mode;
        optimizePage();
      }),
    );
    document
      .querySelector("#optimize-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const topic = form.elements.topic.value.trim();
        if (!topic) {
          notify("Введите тему: поле не должно состоять из пробелов.");
          return;
        }
        state.topic = topic;
        const audience = form.elements.audience.value.toLowerCase();
        const video = state.optimizeMode === "video";
        const title = video
          ? `${topic}: понятный разбор ${audience}`
          : `${topic} — просто и по делу`;
        const description = video
          ? `В этом видео разбираем тему «${topic}» ${audience}.\n\nЧто вы узнаете:\n— с чего начать и на что обратить внимание;\n— какие ошибки встречаются чаще всего;\n— как применить новые знания на практике.\n\nДобавьте конкретные примеры и таймкоды своего видео.\nПоделитесь в комментариях своим опытом и вопросами.`
          : `Здесь мы разбираем тему «${topic}» ${audience}.\n\nПонятные объяснения, полезные примеры и личный опыт.\nДобавьте информацию об авторе и о том, как часто выходят видео.\n\nПодписывайтесь, чтобы учиться и пробовать вместе.`;
        const tags = [
          ...new Set([
            topic,
            ...form.elements.keywords.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            audience,
            video ? "обучение" : "полезный канал",
          ]),
        ].slice(0, 12);
        document.querySelector("#optimization-output").innerHTML =
          `<div class="panel-title"><h2>Ваш черновик</h2><button type="button" class="copy-button" id="copy-result">Скопировать всё</button></div><div class="output-block"><label>${video ? "Название видео" : "Название канала"} · ${title.length} симв.</label><h3>${e(title)}</h3>${title.length > 100 ? '<p class="helper-text">Сократите название до 100 символов перед публикацией.</p>' : ""}</div><div class="output-block"><label>Описание</label><p>${e(description)}</p></div><div class="output-block"><label>Теги</label><div class="output-tags">${tags.map((t) => `<span>${e(t)}</span>`).join("")}</div></div>`;
        document
          .querySelector("#copy-result")
          .addEventListener("click", () =>
            copy(`${title}\n\n${description}\n\nТеги: ${tags.join(", ")}`),
          );
      });
  }
  function competitorsPage() {
    main.innerHTML =
      heading(
        "Учитесь у других авторов",
        "Сравните каналы и посмотрите, какие показатели стоит отслеживать.",
      ) +
      banner +
      `<section class="panel"><div class="panel-title"><h2>Добавьте канал для сравнения</h2><small>Демо-каталог</small></div><div class="competitor-picks">${channels.map((c, i) => `<button data-channel="${i}" ${state.selectedChannels.includes(i) ? "disabled" : ""}>+ ${c.name}</button>`).join("")}</div><p class="helper-text">В демо доступны три вымышленных канала. Поиск реальных каналов будет доступен после подключения YouTube API.</p></section><section class="panel"><div class="panel-title"><h2>Ваше сравнение</h2><small>За 28 дней · пример</small></div>${
        state.selectedChannels.length
          ? `<div class="table-wrap"><table><thead><tr><th>Канал</th><th>Подписчики</th><th>Просмотры</th><th>Вовлечённость</th><th><span class="sr-only">Действия</span></th></tr></thead><tbody>${state.selectedChannels
              .map((index) => {
                const c = channels[index];
                return `<tr><td><div class="channel-cell"><span class="channel-avatar" style="background:${c.color}">${c.name[0]}</span><div>${c.name}<small>${c.handle}</small></div></div></td><td>${number(c.subscribers)}</td><td>${number(c.views)}</td><td>${c.engagement.toLocaleString("ru-RU")}%</td><td><button class="remove-channel" data-remove="${index}" aria-label="Убрать ${c.name}">×</button></td></tr>`;
              })
              .join("")}</tbody></table></div>`
          : '<div class="empty-state"><h3>Список пока пуст</h3><p>Добавьте каналы из каталога выше.</p></div>'
      }</section><section class="panel"><h2>Смотрите не только на размер канала</h2><p class="comparison-note" style="margin-top:14px">Небольшой канал может получать больше реакций на каждый просмотр. Сравнивайте похожие темы и форматы, изучайте вопросы в комментариях и ищите свой способ раскрыть тему.</p></section>`;
    main.querySelectorAll("[data-channel]").forEach((b) =>
      b.addEventListener("click", () => {
        state.selectedChannels.push(Number(b.dataset.channel));
        competitorsPage();
        notify("Канал добавлен в сравнение");
      }),
    );
    main.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => {
        state.selectedChannels = state.selectedChannels.filter(
          (i) => i !== Number(b.dataset.remove),
        );
        competitorsPage();
        notify("Канал убран из сравнения");
      }),
    );
  }
  function ideasPage() {
    main.innerHTML =
      heading(
        "Следующее видео начинается с идеи",
        "Превратите интересную тему в конкретный план.",
      ) +
      `<div class="info-banner">ⓘ Идеи формируются из редакционных шаблонов. Это отправная точка, а не прогноз просмотров.</div><section class="panel"><form id="ideas-form" class="search-controls"><div class="field"><label for="idea-topic">О чём вы хотите рассказать?</label><input id="idea-topic" name="topic" placeholder="Например, нейросети в повседневной жизни" value="${e(state.topic)}" required maxlength="100"></div><div><label for="idea-format">Формат</label><select id="idea-format" name="format"><option value="guide">Разбор и обучение</option><option value="experiment">Эксперимент</option><option value="shorts">Shorts</option></select></div><button class="button button-green" type="submit">Найти идеи ☼</button></form></section><div id="ideas-output" aria-live="polite"></div>`;
    renderIdeas();
    document.querySelector("#ideas-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const topic = form.elements.topic.value.trim();
      if (!topic) {
        notify("Введите тему для видео.");
        return;
      }
      state.topic = topic;
      const format = form.elements.format.value;
      state.ideas = ideaTemplates[format].map((template) => ({
        title: template.replaceAll("{topic}", topic),
        format,
        topic,
      }));
      renderIdeas();
    });
  }
  function renderIdeas() {
    const output = document.querySelector("#ideas-output");
    if (!state.ideas.length) {
      output.innerHTML =
        '<div class="empty-state"><h3>Пустой лист — это начало</h3><p>Введите тему и выберите формат. Получите четыре идеи для первого или следующего видео.</p></div>';
      return;
    }
    output.innerHTML = `<p class="results-caption">4 идеи для вашей темы · Сохранено в этой сессии: ${state.savedIdeas.size}</p><div class="idea-grid">${state.ideas.map((idea, i) => `<article class="idea-card"><small>ИДЕЯ 0${i + 1} · ${idea.format === "shorts" ? "SHORTS" : idea.format === "guide" ? "ОБУЧЕНИЕ" : "ЭКСПЕРИМЕНТ"}</small><h3>${e(idea.title)}</h3><p>${idea.format === "shorts" ? "Начните с вопроса. Покажите один наглядный пример и завершите коротким выводом." : "Обозначьте вопрос в начале. Покажите личный опыт или три конкретных примера. Завершите полезным выводом."}</p><button type="button" class="copy-button" data-save-idea="${i}" aria-pressed="${state.savedIdeas.has(idea.title)}">${state.savedIdeas.has(idea.title) ? "✓ Сохранено" : "Сохранить идею"}</button> <button type="button" class="copy-button" data-copy-idea="${i}">Копировать</button></article>`).join("")}</div>`;
    if (state.savedIdeas.size) {
      output.insertAdjacentHTML(
        "beforeend",
        `<section class="panel saved-ideas"><div class="panel-title"><h2>Сохранённые идеи</h2><small>До перезагрузки страницы</small></div><ul class="saved-list">${[...state.savedIdeas].map((title, index) => `<li><span>${e(title)}</span><button type="button" class="copy-button" data-remove-saved="${index}" aria-label="Убрать идею: ${e(title)}">Убрать</button></li>`).join("")}</ul></section>`,
      );
      output.querySelectorAll("[data-remove-saved]").forEach((button) =>
        button.addEventListener("click", () => {
          state.savedIdeas.delete(
            [...state.savedIdeas][Number(button.dataset.removeSaved)],
          );
          renderIdeas();
        }),
      );
    }
    output.querySelectorAll("[data-save-idea]").forEach((b) =>
      b.addEventListener("click", () => {
        const title = state.ideas[Number(b.dataset.saveIdea)].title;
        state.savedIdeas.has(title)
          ? state.savedIdeas.delete(title)
          : state.savedIdeas.add(title);
        renderIdeas();
        notify("Список сохранённых идей обновлён до перезагрузки страницы");
      }),
    );
    output
      .querySelectorAll("[data-copy-idea]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          copy(state.ideas[Number(b.dataset.copyIdea)].title),
        ),
      );
  }
  function analyticsPage() {
    const select = `<div><label class="sr-only" for="analytics-period">Период статистики</label><select id="analytics-period" class="period-select"><option value="7">Последние 7 дней</option><option value="28">Последние 28 дней</option><option value="90">Последние 90 дней</option></select></div>`;
    main.innerHTML =
      heading(
        "Замечайте свой рост",
        "Демонстрационный канал · Пример того, как может выглядеть ваша статистика.",
        select,
      ) +
      banner +
      metrics(state.period) +
      `<div class="content-columns"><section class="panel"><div class="panel-title"><h2>Динамика просмотров</h2><small>За ${state.period} дней</small></div>${chart(state.period)}</section><section class="panel"><div class="panel-title"><h2>Откуда приходят зрители</h2></div>${[
        ["Рекомендации YouTube", 48],
        ["Поиск YouTube", 27],
        ["Внешние источники", 16],
        ["Другие источники", 9],
      ]
        .map(
          ([label, value]) =>
            `<div class="traffic-row"><div><span>${label}</span><b>${value}%</b></div><span><i style="width:${value}%"></i></span></div>`,
        )
        .join(
          "",
        )}</section></div><section class="panel"><div class="panel-title"><h2>Видео, которые замечают</h2><small>Примеры за ${state.period} дней</small></div><div class="table-wrap"><table><thead><tr><th>Видео</th><th>Просмотры</th><th>Средний просмотр</th><th>CTR</th></tr></thead><tbody>${[
        ["5 нейросетей для повседневных задач", 8240, "4:32", "6,1%"],
        ["Монтаж на телефоне: первый ролик", 6130, "3:48", "5,4%"],
        ["Как я снял первое видео без бюджета", 4280, "5:12", "4,9%"],
      ]
        .map(
          ([title, views, time, ctr]) =>
            `<tr><td>${title}</td><td>${number(Math.round(views * (state.period === "7" ? 0.25 : state.period === "90" ? 2.8 : 1)))}</td><td>${time}</td><td>${ctr}</td></tr>`,
        )
        .join("")}</tbody></table></div></section>`;
    document.querySelector("#analytics-period").value = state.period;
    document
      .querySelector("#analytics-period")
      .addEventListener("change", (event) => {
        state.period = event.target.value;
        analyticsPage();
      });
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Скопировано в буфер обмена");
    } catch {
      notify(
        "Браузер не разрешил копирование. Выделите текст и скопируйте вручную.",
      );
    }
  }
  const pages = {
    overview,
    niches: nichesPage,
    optimize: optimizePage,
    competitors: competitorsPage,
    ideas: ideasPage,
    analytics: analyticsPage,
  };
  function renderRoute() {
    const requested = location.hash.slice(1);
    const route = Object.hasOwn(pages, requested) ? requested : "overview";
    document.title = `${titles[route]} — Signal`;
    document.querySelector("#breadcrumb").innerHTML =
      `Рабочее пространство <b>/ ${titles[route]}</b>`;
    document
      .querySelectorAll("[data-route]")
      .forEach((a) =>
        a.dataset.route === route
          ? a.setAttribute("aria-current", "page")
          : a.removeAttribute("aria-current"),
      );
    pages[route]();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", () => {
    renderRoute();
    main.focus({ preventScroll: true });
  });
  renderRoute();

})();
