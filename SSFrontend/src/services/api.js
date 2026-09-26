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

  bulkImport: async (products) => {
    return await api.post('/products/bulk-import', { products });
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

// Warehouse & Location Service Endpoints
export const warehouseApi = {
  getWarehouses: async () => {
    return await api.get('/warehouses');
  },

  getAll: async () => {
    return await api.get('/warehouses');
  },

  getWarehouseLocations: async (id) => {
    return await api.get(`/warehouses/${id}/locations`);
  },

  getLocationStock: async (id, locationId) => {
    return await api.get(`/warehouses/${id}/locations/${locationId}/stock`);
  },

  createWarehouse: async (warehouseData) => {
    return await api.post('/warehouses', warehouseData);
  },

  createLocation: async (id, locationData) => {
    return await api.post(`/warehouses/${id}/locations`, locationData);
  },
};

// User Management Service Endpoints
export const userApi = {
  getUsers: async () => {
    return await api.get('/users');
  },

  createUser: async (userData) => {
    return await api.post('/users', userData);
  },

  getUserById: async (id) => {
    return await api.get(`/users/${id}`);
  },

  updateUserRole: async (id, role) => {
    return await api.patch(`/users/${id}/role`, { role });
  },
};

// Operations (Receipts & Deliveries) Service Endpoints
export const operationApi = {
  // Operation 1: Receipts (Incoming Goods)
  getReceipts: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/operations/receipts?${queryStr}` : '/operations/receipts';
    return await api.get(endpoint);
  },

  getReceiptById: async (id) => {
    return await api.get(`/operations/receipts/${id}`);
  },

  createReceipt: async (receiptData) => {
    return await api.post('/operations/receipts', receiptData);
  },

  validateReceipt: async (id, data = {}) => {
    return await api.post(`/operations/receipts/${id}/validate`, data);
  },

  // Operation 2: Deliveries (Outgoing Customer Shipments)
  getDeliveries: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/operations/deliveries?${queryStr}` : '/operations/deliveries';
    return await api.get(endpoint);
  },

  getDeliveryById: async (id) => {
    return await api.get(`/operations/deliveries/${id}`);
  },

  createDelivery: async (deliveryData) => {
    return await api.post('/operations/deliveries', deliveryData);
  },

  pickDelivery: async (id) => {
    return await api.post(`/operations/deliveries/${id}/pick`, {});
  },

  packDelivery: async (id) => {
    return await api.post(`/operations/deliveries/${id}/pack`, {});
  },

  validateDelivery: async (id, data = {}) => {
    return await api.post(`/operations/deliveries/${id}/validate`, data);
  },

  cancelDelivery: async (id) => {
    return await api.post(`/operations/deliveries/${id}/cancel`, {});
  },

  // Operation 3: Internal Transfers (Inter-Rack / Inter-Hub)
  getTransfers: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/operations/transfers?${queryStr}` : '/operations/transfers';
    return await api.get(endpoint);
  },

  getTransferById: async (id) => {
    return await api.get(`/operations/transfers/${id}`);
  },

  createTransfer: async (transferData) => {
    return await api.post('/operations/transfers', transferData);
  },

  validateTransfer: async (id) => {
    return await api.post(`/operations/transfers/${id}/validate`, {});
  },

  cancelTransfer: async (id) => {
    return await api.post(`/operations/transfers/${id}/cancel`, {});
  },

  // Operation 4: Stock Adjustments (Physical Cycle Counts & Discrepancies)
  getAdjustments: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/operations/adjustments?${queryStr}` : '/operations/adjustments';
    return await api.get(endpoint);
  },

  createAdjustment: async (adjustmentData) => {
    return await api.post('/operations/adjustments', adjustmentData);
  },

  // Audit Ledger
  getStockLedger: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/operations/ledger?${queryStr}` : '/operations/ledger';
    return await api.get(endpoint);
  },
};

// Stock Ledger Service Endpoints
export const ledgerApi = {
  getLedger: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/ledger?${queryStr}` : '/ledger';
    return await api.get(endpoint);
  },

  exportLedgerUrl: (format = 'pdf') => {
    const envUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${envUrl}/ledger/export?format=${format}`;
  }
};

// Export Service Endpoints
export const exportApi = {
  getReportPdfUrl: (type) => {
    const envUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${envUrl}/export/reports/${type}?format=pdf`;
  },
  getReportExcelUrl: (type) => {
    const envUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${envUrl}/export/reports/${type}?format=excel`;
  }
};

// Dashboard Metrics & Dynamic Multi-Filter Service Endpoints
export const dashboardApi = {
  getMetrics: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/dashboard/metrics?${queryStr}` : '/dashboard/metrics';
    return await api.get(endpoint);
  },

  getOperationsSummary: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/dashboard/operations-summary?${queryStr}` : '/dashboard/operations-summary';
    return await api.get(endpoint);
  }
};

// Supplier Management Service Endpoints
export const supplierApi = {
  getSuppliers: async (params = {}) => {
    const queryStr = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryStr ? `/suppliers?${queryStr}` : '/suppliers';
    return await api.get(endpoint);
  },

  getSupplierById: async (id) => {
    return await api.get(`/suppliers/${id}`);
  },

  createSupplier: async (supplierData) => {
    return await api.post('/suppliers', supplierData);
  },

  updateSupplier: async (id, supplierData) => {
    return await api.put(`/suppliers/${id}`, supplierData);
  },

  deleteSupplier: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  },
};

export default api;




