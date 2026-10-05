export const authActions = {
  auth() {
    return this.run(async () => {
      const data = await this.api(`/api/auth/${this.authAction}`, {
        method: 'POST',
        body: JSON.stringify({ email: this.email, password: this.password }),
      });
      this.password = '';
      this.notice = data.message;
      if (data.token) {
        this.token = data.token;
        this.account = data.email;
        this.authOpen = false;
      }
    });
  },
  logout() {
    // JWT удаляется из памяти страницы; серверный отзыв токена в MVP не реализован.
    this.token = '';
    this.account = '';
    this.saved = [];
    this.page = 'dashboard';
    this.notice = 'Вы вышли из аккаунта.';
  },
};
