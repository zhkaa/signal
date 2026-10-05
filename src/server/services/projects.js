export async function projects(req, action, payload) {
  if (req.app.locals.demo) {
    const storage = req.app.locals.demoProjects;
    const rows = storage.get(req.user.id) || [];
    if (action === 'list') return rows;
    if (action === 'delete') {
      storage.set(
        req.user.id,
        rows.filter((r) => r.id !== payload),
      );
      return;
    }
    if (rows.length >= 50) throw new Error('В деморежиме можно сохранить не более 50 проектов.');
    const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload };
    storage.set(req.user.id, [row, ...rows]);
    return row;
  }
  let query = req.db.from('projects');
  if (action === 'list') query = query.select('*').order('created_at', { ascending: false });
  if (action === 'create')
    query = query
      .insert({ ...payload, user_id: req.user.id })
      .select()
      .single();
  if (action === 'delete') query = query.delete().eq('id', payload);
  const { data, error } = await query;
  if (error) throw new Error('Не удалось выполнить запрос к БД. Проверьте миграции и подключение.');
  return data;
}
