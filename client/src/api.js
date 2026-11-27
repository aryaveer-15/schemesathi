export async function api(path, { method = 'GET', body, signal } = {}) {
  const base = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/+$/, '');
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-SchemeSathi-Request'] = '1';
  }

  const timeout = AbortSignal.timeout(10_000);
  const res = await fetch(`${base}${path}`, {
    credentials: import.meta.env.DEV && base ? 'include' : 'same-origin',
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(data?.error || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return data;
}
