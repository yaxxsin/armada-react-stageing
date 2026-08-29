const BASE = '/api';

function getCsrfSafe() {
  return {
    'Content-Type': 'application/json',
  };
}

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
  return match ? match[1] : '';
}

export async function api(path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    ...getCsrfSafe(),
    ...options.headers,
  };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = getCsrfToken();
  }

  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Sesi berakhir. Silakan login kembali.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Permintaan gagal.');
  }
  return data;
}

export const apiPost = (path, body) =>
  api(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (path, body) =>
  api(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (path) => api(path, { method: 'DELETE' });
