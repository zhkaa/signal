export async function projects(req, action, payload) {
  let query = req.db.from('projects');
  if (action === 'list') {
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page) || 1));
    query = query
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * 12, page * 12 - 1);
    const { data, error, count } = await query;
    if (error) throw Object.assign(new Error('Database failed'), { code: 'DATABASE_FAILED' });
    return { items: data, total: count, page };
  }
  if (action === 'create')
    query = query
      .insert({ ...payload, user_id: req.user.id })
      .select()
      .single();
  if (action === 'delete')
    query = query.delete().eq('id', payload).eq('user_id', req.user.id).select('id');
  const { data, error } = await query;
  if (error) throw Object.assign(new Error('Database failed'), { code: 'DATABASE_FAILED' });
  if (action === 'delete' && !data.length)
    throw Object.assign(new Error('Not found'), { status: 404, code: 'NOT_FOUND' });
  return data;
}
