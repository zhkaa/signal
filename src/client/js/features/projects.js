export const projectActions = {
  save() {
    return this.run(async () => {
      // Сохраняем параметры полученного результата, даже если форма уже изменена.
      const { topic, kind, audience } = this.result;
      await this.api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ topic, kind, audience }),
      });
      this.notice = 'Проект сохранён.';
    });
  },
  loadProjects() {
    return this.run(async () => {
      this.saved = await this.api('/api/projects');
    });
  },
  remove(id) {
    return this.run(async () => {
      await this.api(`/api/projects/${id}`, { method: 'DELETE' });
      this.saved = this.saved.filter((project) => project.id !== id);
      this.notice = 'Проект удалён.';
    });
  },
  openProject(project) {
    this.page = 'optimizer';
    this.result = project.content;
    this.topic = project.title;
    this.kind = project.kind;
    this.audience = project.content.audience || 'начинающих';
  },
};
