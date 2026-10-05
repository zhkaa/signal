import Alpine from '/vendor/alpine.js';
import { request } from './lib/api.js';
import { optimizerActions } from './features/optimizer.js';
import { projectActions } from './features/projects.js';
import { researchActions } from './features/research.js';
import { authActions } from './features/auth.js';

const navigation = [
  { id: 'dashboard', name: 'Главная', icon: 'layout-dashboard' },
  { id: 'optimizer', name: 'Оптимизация', icon: 'sparkles' },
  { id: 'competitors', name: 'Конкуренты', icon: 'users-round' },
  { id: 'niches', name: 'Поиск ниш', icon: 'search' },
  { id: 'analytics', name: 'Статистика', icon: 'chart-no-axes-combined' },
  { id: 'projects', name: 'Мои проекты', icon: 'folder-open' },
];

/** Корневое состояние страницы. Предметная логика находится в features/. */
Alpine.data('signal', () => ({
  page: 'dashboard',
  demo: true,
  mobile: false,
  busy: false,
  notice: '',
  error: '',
  kind: 'video',
  topic: '',
  audience: 'начинающих',
  result: null,
  query: '',
  channelRows: [],
  nicheRows: [],
  saved: [],
  token: '',
  email: '',
  password: '',
  account: '',
  authOpen: false,
  authAction: 'login',
  nav: navigation,
  ...optimizerActions,
  ...projectActions,
  ...researchActions,
  ...authActions,

  get heading() {
    return this.nav.find((item) => item.id === this.page)?.name || 'Главная';
  },
  async init() {
    try {
      this.demo = (await this.api('/api/config')).demo;
    } catch (error) {
      this.error = error.message;
    }
  },
  api(url, options) {
    return request(url, options, this.token);
  },

  // Один запрос на действие: блокируем повторные нажатия и всегда снимаем загрузку.
  async run(action) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await action();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.busy = false;
    }
  },
  go(id) {
    if (this.busy) return;
    this.page = id;
    this.mobile = false;
    this.error = '';
    this.notice = '';
    this.query = '';
    this.channelRows = [];
    this.nicheRows = [];
    if (id === 'projects') this.loadProjects();
  },
  num(value) {
    return value == null
      ? 'Скрыто'
      : new Intl.NumberFormat('ru-RU', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
  },
}));

// Стартуем после регистрации компонентов: порядок загрузки не зависит от CDN.
Alpine.start();
