export const researchActions = {
  async search() {
    if (!this.validate(['query'])) return;
    this.updateUrl();
    const page = this.page,
      generation = this.generation,
      query = this.query;
    this.searched = true;
    await this.run(async () => {
      const data = await this.api(
        '/api/' +
          (page === 'niches' ? 'niches' : 'channels') +
          '?q=' +
          encodeURIComponent(query) +
          '&locale=' +
          this.locale,
      );
      if (page !== this.page || generation !== this.generation) return;
      if (page === 'niches') this.nicheRows = data.items;
      else this.channelRows = data.items;
      this.searches++;
      this.notice = '';
    });
  },
  clearSearch() {
    if (this.busy) return;
    this.query = '';
    this.searched = false;
    this.channelRows = [];
    this.nicheRows = [];
    this.fieldErrors = {};
    this.updateUrl();
    this.$nextTick(() => this.$refs.searchInput.focus());
  },
  toggleChannel(row) {
    const found = this.selectedChannels.some((x) => x.id === row.id);
    if (found) this.selectedChannels = this.selectedChannels.filter((x) => x.id !== row.id);
    else if (this.selectedChannels.length < 4) this.selectedChannels.push(row);
  },
  useTopic(row) {
    this.navigate('/app/optimizer');
    this.topic = row.title;
  },
};
