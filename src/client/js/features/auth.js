export const authActions = {
  async authenticate() {
    const fields =
      this.page === 'register'
        ? ['name', 'email', 'password', 'confirmPassword']
        : ['forgot-password', 'resend-confirmation'].includes(this.page)
          ? ['email']
          : this.page === 'reset-password'
            ? ['password', 'confirmPassword']
            : ['email', 'password'];
    if (this.page === 'resend-confirmation' && this.resendWaiting) return;
    if (!this.validate(fields)) return;
    await this.run(async () => {
      const action = {
        login: 'login',
        register: 'register',
        'forgot-password': 'recover',
        'reset-password': 'password',
        'resend-confirmation': 'resend',
      }[this.page];
      const data = await this.api('/api/auth/' + action, {
        method: 'POST',
        body: JSON.stringify({
          email: this.email,
          password: this.password,
          name: this.name,
          locale: this.locale,
        }),
      });
      this.password = '';
      this.confirmPassword = '';
      if (this.page === 'resend-confirmation') {
        this.notice = 'confirmationSent';
        this.resendWaiting = true;
        setTimeout(() => {
          this.resendWaiting = false;
        }, 60000);
        return;
      }
      if (this.page === 'forgot-password') {
        this.notice = 'emailSent';
        return;
      }
      if (this.page === 'reset-password') {
        this.user = null;
        this.navigate('/login');
        this.notice = 'passwordSaved';
        return;
      }
      if (!data.authenticated) {
        this.notice = 'confirmed';
        return;
      }
      this.user = await this.api('/api/auth/me');
      this.profileName = this.user.name;
      const target = this.returnTo || '/app/dashboard';
      this.returnTo = '';
      this.navigate(target);
    });
  },
  async google() {
    await this.run(async () => {
      const { url } = await this.api('/api/auth/google', { method: 'POST', body: '{}' });
      const target = new URL(url);
      if (!['https:', 'http:'].includes(target.protocol)) throw new Error('OAUTH_FAILED');
      location.assign(target.href);
    });
  },
  async logout() {
    await this.run(async () => {
      await this.api('/api/auth/logout', { method: 'POST', body: '{}' });
      this.clearAccount();
      this.channel?.postMessage('logout');
      this.navigate('/login');
    });
  },
  clearAccount() {
    this.controller?.abort();
    this.user = null;
    this.saved = [];
    this.totalProjects = 0;
    this.channelRows = [];
    this.nicheRows = [];
    this.selectedChannels = [];
    this.result = null;
    this.topic = '';
    this.audience = '';
    this.query = '';
    this.adminData = null;
    this.searches = 0;
    this.profileName = '';
    this.name = '';
    this.password = '';
    this.confirmPassword = '';
    this.generation++;
  },
  async saveProfile() {
    this.name = this.profileName;
    if (!this.validate(['name'])) return;
    await this.run(async () => {
      const data = await this.api('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: this.profileName }),
      });
      this.user.name = data.name;
      this.profileName = data.name;
      this.notice = 'changesSaved';
    });
  },
};
