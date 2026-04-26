const API_BASE_URL = '';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('dinkans_token');
  
  const headers = {
    ...options.headers
  };
  
  // Only set Content-Type to JSON if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('dinkans_token');
    localStorage.removeItem('dinkans_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
