const API_BASE = 'http://127.0.0.1:8000';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = (data && (data.error || data.detail || JSON.stringify(data))) || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}
