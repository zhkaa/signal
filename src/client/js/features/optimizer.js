/** Действия оптимизатора вызываются с this, указывающим на Alpine-компонент. */
export const optimizerActions = {
  generate() {
    return this.run(async () => {
      this.result = await this.api('/api/optimize', {
        method: 'POST',
        body: JSON.stringify({ topic: this.topic, kind: this.kind, audience: this.audience }),
      });
    });
  },
  copy() {
    return this.run(async () => {
      const { titles, description, tags } = this.result;
      await navigator.clipboard.writeText(
        `${titles.join('\n')}\n\n${description}\n\n${tags.join(', ')}`,
      );
      this.notice = 'Результат скопирован.';
    });
  },
};
