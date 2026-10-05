/** Общий HTTP-клиент. Токен берётся из памяти, а не из localStorage. */
export async function request(url, options = {}, token = '') {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ error: 'Сервис временно недоступен.' }));
  if (!response.ok) throw new Error(data.error || 'Ошибка запроса. Повторите позже.');
  return data;
}
