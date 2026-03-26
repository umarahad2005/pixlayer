const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('px_token');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
}

export const apiClient = {
    get: (endpoint) => request(endpoint),
    post: (endpoint, data) =>
        request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    patch: (endpoint, data) =>
        request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
    upload: (endpoint, formData) =>
        request(endpoint, { method: 'POST', body: formData }),
};
