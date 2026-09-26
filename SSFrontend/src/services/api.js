// ============================================================================
// StockSense API Client Service
// Native fetch client with authorization headers and centralized error handling
// ============================================================================

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return envUrl.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
    }
    return envUrl;
  }
  return envUrl || '/api/v1';
};

const BASE_URL = getBaseUrl();

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

  checkOtp: async (email, otp) => {
    return await api.post('/auth/check-otp', { email, otp });
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

// Product Service Endpoints
export const productApi = {
  getProducts: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/products?${queryStr}` : '/products';
    return await api.get(endpoint);
  },

  getProductById: async (id) => {
    return await api.get(`/products/${id}`);
  },

  createProduct: async (productData) => {
    return await api.post('/products', productData);
  },

  updateProduct: async (id, productData) => {
    return await api.put(`/products/${id}`, productData);
  },

  deleteProduct: async (id) => {
    return await api.delete(`/products/${id}`);
  },
};

// Category Service Endpoints
export const categoryApi = {
  getCategories: async () => {
    return await api.get('/categories');
  },

  createCategory: async (categoryData) => {
    return await api.post('/categories', categoryData);
  },

  updateCategory: async (id, categoryData) => {
    return await api.put(`/categories/${id}`, categoryData);
  },

  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  },
};

export default api;

