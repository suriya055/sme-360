import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const APP_BOOT_MS = Date.now();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // [FIX #12] Handle network-down state — error.response is undefined when server is unreachable
    if (!error.response) {
      // Avoid spamming a scary toast during initial page boot / Render cold start.
      if (Date.now() - APP_BOOT_MS < 2500) {
        return Promise.reject(error);
      }
      // Dynamically import toast to avoid circular deps
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('⚠️ Cannot connect to server. Please check your connection.', {
          id: 'network-error', // Prevent duplicate toasts
          duration: 6000,
        });
      });
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // GitHub Pages hosts under "/<repo>/", so never hardcode absolute "/login".
      window.location.href = `${import.meta.env.BASE_URL}login`;
    } else if (status === 500) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Server error. Please try again shortly.', { id: 'server-error-500' });
      });
    } else if (status === 404) {
      // 404s are common for optional resource checks — log silently, don't show toast
      console.warn('[API] 404 Not Found:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  logout: () => api.post('/auth/logout')
};

// Products API
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => {
    const isFormData = (typeof FormData !== 'undefined') && (productData instanceof FormData);
    if (isFormData) {
      return api.post('/products', productData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/products', productData);
  },
  update: (id, productData) => {
    const isFormData = (typeof FormData !== 'undefined') && (productData instanceof FormData);
    if (isFormData) {
      return api.put(`/products/${id}`, productData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/products/${id}`, productData);
  },
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, stockData) => api.patch(`/products/${id}/stock`, stockData),
  getStats: () => api.get('/products/stats/overview'),
  import: (formData) => api.post('/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  export: () => api.get('/products/export', { responseType: 'blob' })
};

// Sales API
export const saleAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (saleData) => api.post('/sales', saleData),
  updateStatus: (id, statusData) => api.patch(`/sales/${id}/status`, statusData),
  cancel: (id) => api.patch(`/sales/${id}/status`, { status: 'cancelled' }),
  getStats: (params) => api.get('/sales/stats/overview', { params }),
  getAnalytics: () => api.get('/sales/analytics'),
  downloadReceipt: (id) => api.get(`/sales/${id}/receipt`, { responseType: 'blob' })
};

// Customers API
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
  getStats: () => api.get('/customers/stats/overview')
};

// Expenses API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expenseData) => api.post('/expenses', expenseData),
  update: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  delete: (id) => api.delete(`/expenses/${id}`),
  approve: (id, receiptData) => api.patch(`/expenses/${id}/approve`, receiptData),
  getStats: (params) => api.get('/expenses/stats/overview', { params })
};

// Admin API
export const adminAPI = {
  resetData: () => api.delete('/admin/reset')
};

// Users API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, passwordData) => api.post(`/users/${id}/change-password`, passwordData),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  setMyWhatsAppPin: (data) => api.post('/users/me/security/pin', data)
};

export const queryAPI = {
  getAll: (params) => api.get('/queries', { params }),
  getById: (id) => api.get(`/queries/${id}`),
  create: (data) => api.post('/queries', data), // Admin initiates
  reply: (id, data) => api.post(`/queries/${id}/reply`, data),
  updateStatus: (id, status) => api.patch(`/queries/${id}/status`, { status })
};

// Tenant / Bot Management API [CLOUD API]
export const tenantAPI = {
  getWhatsAppStatus: () => api.get('/tenants/whatsapp/status'),
  getWhatsAppDiagnostics: () => api.get('/tenants/whatsapp/diagnostics'),
  saveCloudCredentials: (data) => api.post('/tenants/whatsapp/credentials', data),
  testBotConnection: (data) => api.post('/tenants/whatsapp/test', data),
  disconnectWhatsApp: () => api.post('/tenants/whatsapp/disconnect'),
  getSettings: () => api.get('/tenants/settings'),
  updateSettings: (settingsData) => api.put('/tenants/settings', settingsData)
};

// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

// Purchase Order API
export const purchaseOrderAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  updateStatus: (id, statusData) => api.patch(`/purchase-orders/${id}/status`, statusData),
  cancel: (id) => api.delete(`/purchase-orders/${id}`)
};

// Accounts Payable API
export const payableAPI = {
  getAll: (params) => api.get('/payables', { params }),
  getById: (id) => api.get(`/payables/${id}`),
  create: (data) => api.post('/payables', data),
  update: (id, data) => api.put(`/payables/${id}`, data),
  getStats: () => api.get('/payables/stats/overview')
};

// Campaign API
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  delete: (id) => api.delete(`/campaigns/${id}`)
};

// Audit Log API
export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
  getStats: () => api.get('/audit/stats')
};

export default api;
