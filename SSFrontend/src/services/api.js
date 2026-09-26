// ============================================================================
// StockSense API Client Service
// Native fetch client with authorization headers and centralized error handling
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem('stocksense_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('stocksense_token', token);
    } else {
      localStorage.removeItem('stocksense_token');
    }
  }

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('stocksense_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('stocksense_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stocksense_user');
    }
  }

  clearAuth() {
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.message || data?.error || `HTTP ${response.status} Error`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const netErr = new Error('Cannot connect to StockSense server. Please ensure the backend is running on port 5002.');
        netErr.status = 503;
        throw netErr;
      }
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(BASE_URL);

// Auth Service Endpoints
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res?.data?.token) {
      api.setToken(res.data.token);
      api.setCurrentUser(res.data.user);
    }
    return res;
  },

  register: async ({ name, email, password, role, department }) => {
    const res = await api.post('/auth/register', { name, email, password, role, department });
    if (res?.data?.token) {
      api.setToken(res.data.token);
      api.setCurrentUser(res.data.user);
    }
    return res;
  },

  sendOtp: async (email, name) => {
    return await api.post('/auth/send-otp', { email, name });
  },

  verifyOtp: async (email, otp, name) => {
    const res = await api.post('/auth/verify-otp', { email, otp, name });
    if (res?.data?.token) {
      api.setToken(res.data.token);
      api.setCurrentUser(res.data.user);
    }
    return res;
  },

  resetPassword: async (email, otp, newPassword) => {
    return await api.post('/auth/reset-password', { email, otp, newPassword });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      api.clearAuth();
    }
  },
};

export default api;
