export const projectActions = {
  async loadProjects() {
    await this.run(async () => {
      const generation = this.generation;
      const data = await this.api('/api/projects?page=' + this.listPage);
      if (generation !== this.generation) return;
      this.saved = data.items;
      this.totalProjects = data.total;
      const max = Math.max(1, Math.ceil(data.total / 12));
      if (this.listPage > max) {
        this.listPage = max;
        this.updateUrl();
        const next = await this.api('/api/projects?page=' + max);
        this.saved = next.items;
      }
    });
  },
  async saveProject() {
    if (!this.result || this.resultSaved) return;
    await this.run(async () => {
      const { topic, kind, audience, locale } = this.result;
      await this.api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ topic, kind, audience, locale }),
      });
      this.resultSaved = true;
      this.listPage = 1;
      this.navigate('/app/projects');
      this.notice = 'projectSaved';
    });
  },
  openProject(project) {
    this.navigate('/app/optimizer');
    this.result = project.content;
    this.topic = project.title;
    this.kind = project.kind;
    this.audience = project.content.audience;
    this.resultSaved = true;
  },
  askDelete(project) {
    this.deleteTarget = project;
    this.dialogError = '';
    this.$refs.deleteDialog.showModal();
    this.$nextTick(() => this.$refs.cancelDelete.focus());
  },
  async deleteProject() {
    if (!this.deleteTarget) return;
    this.dialogError = '';
    await this.run(async () => {
      await this.api('/api/projects/' + this.deleteTarget.id, { method: 'DELETE', body: '{}' });
      this.$refs.deleteDialog.close();
      this.deleteTarget = null;
      const data = await this.api('/api/projects?page=' + this.listPage);
      this.saved = data.items;
      this.totalProjects = data.total;
      if (this.listPage > 1 && !data.items.length) {
        this.listPage--;
        this.updateUrl();
        const next = await this.api('/api/projects?page=' + this.listPage);
        this.saved = next.items;
      }
      this.notice = 'projectDeleted';
      this.$nextTick(() => this.$refs.pageHeading?.focus());
    }, true);
  },
  changeListPage(delta) {
    this.listPage += delta;
    this.updateUrl();
    this.loadProjects();
  },
};
