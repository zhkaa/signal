export const optimizerActions = {
  async generate() {
    if (!this.validate(['topic'])) return;
    await this.run(async () => {
      this.result = await this.api('/api/optimize', {
        method: 'POST',
        body: JSON.stringify({
          topic: this.topic,
          kind: this.kind,
          audience: this.audience,
          locale: this.locale,
        }),
      });
      this.resultSaved = false;
    });
  },
  async copyResult() {
    if (!this.result) return;
    await this.run(async () => {
      const { titles, description, tags } = this.result;
      await navigator.clipboard.writeText(
        titles.join('\n') + '\n\n' + description + '\n\n' + tags.join(', '),
      );
      this.notice = 'copied';
    });
  },
};
