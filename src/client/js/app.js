import Alpine from '/vendor/alpine.js';
import { request } from './lib/api.js';
import { translate } from './lib/i18n.js';
import { authActions } from './features/auth.js';
import { optimizerActions } from './features/optimizer.js';
import { projectActions } from './features/projects.js';
import { researchActions } from './features/research.js';
const nav = [
  { id: 'dashboard', icon: 'layout-dashboard' },
  { id: 'niches', icon: 'search' },
  { id: 'optimizer', icon: 'sliders-horizontal' },
  { id: 'competitors', icon: 'users-round' },
  { id: 'analytics', icon: 'chart-no-axes-combined' },
  { id: 'projects', icon: 'folder-open' },
];
Alpine.data('signal', () => ({
  locale: localStorage.getItem('signal-locale') === 'en' ? 'en' : 'ru',
  page: 'landing',
  shell: 'public',
  ready: false,
  mobile: false,
  busy: false,
  error: '',
  notice: '',
  online: navigator.onLine,
  user: null,
  config: { auth: false, youtube: false },
  nav,
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  profileName: '',
  showPassword: false,
  resendWaiting: false,
  fieldErrors: {},
  returnTo: '',
  kind: 'video',
  topic: '',
  audience: '',
  result: null,
  resultSaved: true,
  query: '',
  searched: false,
  channelRows: [],
  nicheRows: [],
  selectedChannels: [],
  searches: 0,
  saved: [],
  totalProjects: 0,
  listPage: 1,
  deleteTarget: null,
  dialogError: '',
  adminData: null,
  adminPage: 1,
  announcementRu: '',
  announcementEn: '',
  generation: 0,
  channel: null,
  controller: null,
  ...authActions,
  ...optimizerActions,
  ...projectActions,
  ...researchActions,
  t(key) {
    return translate(this.locale, key);
  },
  get heading() {
    return this.t(this.page);
  },
  get isAuth() {
    return [
      'login',
      'register',
      'forgot-password',
      'reset-password',
      'resend-confirmation',
    ].includes(this.page);
  },
  get announcement() {
    return (
      this.config.announcement?.[this.locale === 'en' ? 'announcement_en' : 'announcement_ru'] || ''
    );
  },
  get hasUnsaved() {
    return (
      Boolean(this.result && !this.resultSaved) ||
      Boolean(this.user && this.profileName !== this.user.name) ||
      Boolean(
        this.adminData &&
        (this.announcementRu !== this.adminData.settings.announcement_ru ||
          this.announcementEn !== this.adminData.settings.announcement_en),
      )
    );
  },
  async init() {
    this.readRoute();
    window.addEventListener('popstate', () => {
      this.generation++;
      if (this.busy) {
        this.pendingRoute = location.pathname + location.search;
        return;
      }
      this.readRoute();
      this.onRoute();
    });
    window.addEventListener('online', () => (this.online = true));
    window.addEventListener('offline', () => (this.online = false));
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('signal-account');
      this.channel.onmessage = (e) => {
        if (e.data === 'logout') {
          this.clearAccount();
          this.navigate('/login');
        }
      };
    }
    try {
      this.config = await this.api('/api/config');
    } catch (e) {
      this.error = e.code || 'REQUEST_FAILED';
    }
    if (this.config.auth) {
      try {
        this.user = await request('/api/auth/me');
        this.profileName = this.user.name;
      } catch (e) {
        if (e.status !== 401) this.error = e.code || 'REQUEST_FAILED';
      }
    }
    if (this.shell === 'app' && !this.user) {
      this.returnTo = location.pathname + location.search;
      this.navigate('/login', true);
    }
    if (this.page === 'reset-password' && !this.user) this.navigate('/forgot-password', true);
    const params = new URLSearchParams(location.search);
    if (params.has('oauth_error')) this.error = 'OAUTH_FAILED';
    if (params.has('confirmed')) this.notice = 'confirmed';
    this.ready = true;
    this.syncLocale();
    this.onRoute();
  },
  readRoute() {
    const path = location.pathname;
    this.shell = path.startsWith('/app/') ? 'app' : 'public';
    this.page =
      path === '/' ? 'landing' : this.shell === 'app' ? path.split('/')[2] : path.slice(1);
    const known = [
      'landing',
      'login',
      'register',
      'forgot-password',
      'reset-password',
      'resend-confirmation',
      ...nav.map((x) => x.id),
      'settings',
      'admin',
    ];
    if (!known.includes(this.page)) this.page = 'notFound';
    const params = new URLSearchParams(location.search);
    this.query = params.get('q') || '';
    this.listPage = Math.max(1, Number.parseInt(params.get('page')) || 1);
    this.adminPage = this.listPage;
    this.title();
  },
  navigate(path, replace = false) {
    if (this.busy) {
      this.pendingRoute = path;
      return;
    }
    this.generation++;
    this.mobile = false;
    this.error = '';
    this.notice = '';
    this.fieldErrors = {};
    this.showPassword = false;
    this.password = '';
    this.confirmPassword = '';
    history[replace ? 'replaceState' : 'pushState']({}, '', path);
    this.readRoute();
    this.onRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.$nextTick(() => this.$refs.pageHeading?.focus());
  },
  link(event, path) {
    event.preventDefault();
    this.navigate(path);
  },
  async onRoute() {
    this.title();
    if (this.shell === 'app' && !this.user) {
      this.returnTo = location.pathname + location.search;
      this.navigate('/login', true);
      return;
    }
    if (!this.ready) return;
    if (this.page === 'projects' || this.page === 'dashboard') await this.loadProjects();
    if (this.page === 'admin' && this.user?.admin) await this.loadAdmin();
    if (['niches', 'competitors', 'analytics'].includes(this.page)) {
      this.channelRows = [];
      this.nicheRows = [];
      this.searched = false;
      if (this.query.trim().length >= 2 && this.config.youtube) await this.search();
    }
  },
  title() {
    document.title =
      (this.page === 'landing'
        ? this.t('tagline')
        : this.isAuth
          ? this.t(
              this.page === 'register'
                ? 'signupTitle'
                : this.page === 'login'
                  ? 'authTitle'
                  : this.page === 'forgot-password'
                    ? 'recoverTitle'
                    : this.page === 'resend-confirmation'
                      ? 'resendTitle'
                      : 'resetTitle',
            )
          : this.heading) + ' — Signal';
  },
  toggleLocale() {
    this.locale = this.locale === 'ru' ? 'en' : 'ru';
    localStorage.setItem('signal-locale', this.locale);
    this.syncLocale();
  },
  syncLocale() {
    document.documentElement.lang = this.locale;
    this.title();
  },
  updateUrl() {
    const params = new URLSearchParams();
    if (['niches', 'competitors', 'analytics'].includes(this.page) && this.query.trim())
      params.set('q', this.query.trim());
    if (['projects', 'admin'].includes(this.page)) {
      const page = this.page === 'admin' ? this.adminPage : this.listPage;
      if (page > 1) params.set('page', page);
    }
    history.replaceState({}, '', location.pathname + (params.size ? '?' + params : ''));
  },
  async api(url, options) {
    const signal = this.controller
      ? AbortSignal.any([this.controller.signal, AbortSignal.timeout(20000)])
      : undefined;
    return request(url, { ...options, ...(signal ? { signal } : {}) });
  },
  async run(action, dialog = false) {
    if (this.busy) return;
    this.busy = true;
    this.controller = new AbortController();
    this.error = '';
    this.notice = '';
    const generation = this.generation;
    try {
      await action();
    } catch (e) {
      if (generation === this.generation) {
        const code = e.code || 'REQUEST_FAILED';
        if (dialog) this.dialogError = code;
        else this.error = code;
        if (e.status === 401) {
          this.busy = false;
          this.returnTo = location.pathname + location.search;
          this.user = null;
          this.navigate('/login');
          this.error = 'SESSION_REQUIRED';
        }
      }
    } finally {
      this.busy = false;
      this.controller = null;
    }
    // Route changes from successful actions are performed after releasing the guard.
    if (this.pendingRoute) {
      const path = this.pendingRoute;
      this.pendingRoute = '';
      const notice = this.notice;
      this.navigate(path);
      this.notice = notice;
    }
    if (generation !== this.generation && dialog) this.dialogError = '';
  },
  pendingRoute: '',
  validate(fields) {
    this.fieldErrors = {};
    for (const field of fields) {
      const v = this[field] || '';
      if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        this.fieldErrors[field] = 'emailError';
      if (field === 'name' && (v.trim().length < 2 || v.length > 100))
        this.fieldErrors[field] = 'nameError';
      if (field === 'password' && (v.length < 8 || v.length > 128))
        this.fieldErrors[field] = 'passwordError';
      if (field === 'confirmPassword' && v !== this.password)
        this.fieldErrors[field] = 'confirmError';
      if (field === 'topic' && (v.trim().length < 3 || v.length > 160))
        this.fieldErrors[field] = 'topicError';
      if (field === 'query' && (v.trim().length < 2 || v.length > 100))
        this.fieldErrors[field] = 'queryError';
    }
    const first = Object.keys(this.fieldErrors)[0];
    if (first) {
      this.$nextTick(() =>
        document
          .getElementById(first === 'name' && this.page === 'settings' ? 'profile-name' : first)
          ?.focus(),
      );
      return false;
    }
    return true;
  },
  num(value) {
    return value == null
      ? this.t('hidden')
      : new Intl.NumberFormat(this.locale === 'ru' ? 'ru-RU' : 'en-US', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
  },
  date(value) {
    return new Intl.DateTimeFormat(this.locale === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Qyzylorda',
    }).format(new Date(value));
  },
  timestamp(value) {
    return new Intl.DateTimeFormat(this.locale === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Qyzylorda',
    }).format(new Date(value));
  },
  async loadAdmin() {
    await this.run(async () => {
      const data = await this.api('/api/admin/overview?page=' + this.adminPage);
      this.adminData = data;
      this.announcementRu = data.settings.announcement_ru;
      this.announcementEn = data.settings.announcement_en;
    });
  },
  async saveAnnouncement() {
    await this.run(async () => {
      const data = await this.api('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          announcement_ru: this.announcementRu,
          announcement_en: this.announcementEn,
          version: this.adminData.settings.version,
        }),
      });
      this.adminData.settings = data;
      this.announcementRu = data.announcement_ru;
      this.announcementEn = data.announcement_en;
      this.config.announcement = data;
      this.notice = 'changesSaved';
    });
  },
  changeAdminPage(delta) {
    this.adminPage += delta;
    this.updateUrl();
    this.loadAdmin();
  },
}));
Alpine.start();
