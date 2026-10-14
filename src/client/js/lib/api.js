export async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    signal: options.signal || AbortSignal.timeout(20000),
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ code: 'REQUEST_FAILED' }));
  if (!response.ok)
    throw Object.assign(new Error(data.code || 'REQUEST_FAILED'), {
      code: data.code || 'REQUEST_FAILED',
      status: response.status,
    });
  return data;
}
