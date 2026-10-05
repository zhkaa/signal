export const researchActions = {
  search() {
    // Запоминаем экран: ответ старого запроса не должен менять новую вкладку.
    const page = this.page;
    return this.run(async () => {
      const resource = page === 'niches' ? 'niches' : 'channels';
      const data = await this.api(`/api/${resource}?q=${encodeURIComponent(this.query)}`);
      if (this.page !== page) return;
      if (page === 'niches') this.nicheRows = data.items;
      else this.channelRows = data.items;
      this.notice = !data.items.length
        ? 'Ничего не найдено. Попробуйте другой запрос.'
        : data.demo
          ? 'Показаны демонстрационные примеры, не результаты реального поиска.'
          : 'Данные получены из YouTube Data API.';
    });
  },
};
