import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateProducts, generateSales, generateCustomers, generateExpenses } from '../data/mockData';
import { useToast } from '@chakra-ui/react';
import toast from 'react-hot-toast';
import { expenseAPI, authAPI, productAPI, saleAPI, customerAPI, adminAPI, tenantAPI } from '../services/api';
import { enqueueCustomer, listPendingCustomers, markCustomerSynced } from '../offline/customerOutbox';

export const AppContext = createContext();

// Default settings
const defaultSettings = {
  // Feature flags (per-tenant when backend is connected)
  features: {
    loyaltyEnabled: true
  },
  // Store Information
  storeName: 'Smart Business Store',
  contactNumber: '+91 98765 43210',
  email: 'store@example.com',
  address: '123 Market Street, Tech City, Bangalore - 560001',
  currency: '₹',
  logoUrl: null,
  businessHours: {
    open: '09:00',
    close: '21:00'
  },

  // POS Settings
  posSettings: {
    autoPrintReceipt: false,
    requireCustomerForSale: false,
    showStockDuringSale: true,
    enableDiscounts: true,
    enableTax: true,
    roundOffTotal: false,
    defaultPaymentMethod: 'cash'
  },

  // Invoice Settings
  invoiceSettings: {
    prefix: 'INV',
    startNumber: 1001,
    includeLogo: true
  },
  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'Please visit again!\nContact: +91 98765 43210',
  receiptTaxNumber: 'GSTIN: 27ABCDE1234F1Z5',

  // Tax Settings
  gstRate: 18,
  taxSettings: {
    taxType: 'gst',
    includeInPrice: false
  },

  // Payment Methods
  paymentMethods: {
    cash: true,
    card: false,
    // UPI is a common POS method; enabling by default keeps POS/transactions consistent.
    upi: true,
    digitalWallet: false
  },

  // Inventory Settings
  lowStockThreshold: 10,
  inventorySettings: {
    autoReorder: false,
    showCostPrice: false,
    enableCategories: true,
    enableBarcode: true
  },

  // Alert Settings
  enableLowStockAlerts: true,
  enableEmailReports: false,
  emailReportTime: '19:00',

  // Theme Settings
  theme: {
    primaryColor: '#0ea5e9',
    secondaryColor: '#f59e0b',
    darkMode: false
  }
};

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [useBackendAPI, setUseBackendAPI] = useState(false); // Toggle between backend and localStorage
  const chakraToast = useToast();

  const makeClientCustomerId = () => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {
      // ignore
    }
    return `cc_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const isNetworkishError = (err) => {
    // axios/fetch-like "no response" or explicit network error
    if (!err) return false;
    if (err.message && String(err.message).toLowerCase().includes('network')) return true;
    if (!err.response) return true;
    return false;
  };

  const syncCustomerOutbox = async () => {
    if (!useBackendAPI) return;
    if (!localStorage.getItem('token')) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    let pending = [];
    try {
      pending = await listPendingCustomers(50);
    } catch (e) {
      // IndexedDB not available (private mode / older browser) - skip quietly
      return;
    }
    if (!pending.length) return;

    for (const row of pending) {
      const clientCustomerId = row?.clientCustomerId;
      const payload = row?.payload;
      if (!clientCustomerId || !payload) continue;

      try {
        const res = await customerAPI.create(payload);
        const created = res?.data;
        if (created) {
          // Replace the local placeholder (if any) with the server record.
          setCustomers((prev) => {
            const without = prev.filter((c) =>
              c?.clientCustomerId !== clientCustomerId &&
              c?.id !== clientCustomerId &&
              c?._id !== clientCustomerId
            );
            return [created, ...without];
          });
        }
        await markCustomerSynced(clientCustomerId);
      } catch (e) {
        // If backend is still down/cold-starting, stop trying for now.
        if (isNetworkishError(e) || e.response?.status === 503) return;
        // For validation conflicts etc, don't keep retrying forever.
        await markCustomerSynced(clientCustomerId);
      }
    }
  };

  // Check if backend is available
  const checkBackendAvailability = async () => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    // If VITE_API_URL is absolute (Render), probe that backend. Otherwise keep local dev behavior.
    const healthUrl = typeof apiBase === 'string' && apiBase.startsWith('http')
      ? apiBase.replace(/\/api\/?$/, '') + '/health'
      : '/health';

    try {
      // Render free tier can cold-start; retry a few times before falling back.
      for (let attempt = 0; attempt < 6; attempt++) {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(healthUrl, { cache: 'no-store' });
        if (response.ok) {
          setUseBackendAPI(true);
          return true;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
      }
    } catch (error) {
      console.log('Backend not available, using localStorage');
    }
    return false;
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      const backendAvailable = await checkBackendAvailability();

      if (backendAvailable && localStorage.getItem('token')) {
        // Backend is available and user is authenticated
        await fetchDataFromBackend();
      } else {
        // Use localStorage
        loadFromLocalStorage();
      }

      setLoading(false);
    };

    initialize();
  }, []);

  // When the browser comes back online, try to flush offline-created customers.
  useEffect(() => {
    const onOnline = () => {
      syncCustomerOutbox().catch(() => {});
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
      }
    };
  }, [useBackendAPI]);

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const savedSettings = localStorage.getItem('settings');
      const savedProducts = localStorage.getItem('products');
      const savedSales = localStorage.getItem('sales');
      const savedCustomers = localStorage.getItem('customers');
      const savedExpenses = localStorage.getItem('expenses');
      const savedNotifications = localStorage.getItem('notifications');

      // Load authentication
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }

      // Load settings
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Load data or generate mock data
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(generateProducts(24));
      }

      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      } else {
        setCustomers(generateCustomers(15));
      }

      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        setExpenses(generateExpenses(12));
      }

      if (savedSales) {
        setSales(JSON.parse(savedSales));
      } else {
        setTimeout(() => {
          const generatedSales = generateSales(
            JSON.parse(savedProducts || JSON.stringify(generateProducts(24))),
            JSON.parse(savedCustomers || JSON.stringify(generateCustomers(15))),
            20
          );
          setSales(generatedSales);
        }, 100);
      }

      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        setNotifications([
          {
            id: '1',
            title: 'Welcome to SmartPOS!',
            message: 'You can use this system offline with localStorage',
            time: 'Just now',
            type: 'info',
            read: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      initializeDefaultData();
    }
  };

  // Fetch data from backend
  const fetchDataFromBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all data in parallel
      const [productsData, salesData, customersData, expensesData, userProfile, settingsData] = await Promise.all([
        productAPI.getAll({ limit: 100 }).catch(() => ({ data: [] })),
        saleAPI.getAll({ limit: 50 }).catch(() => ({ data: [] })),
        customerAPI.getAll({ limit: 50 }).catch(() => ({ data: [] })),
        expenseAPI.getAll({ limit: 50 }).catch(() => ({ data: [] })),
        authAPI.getProfile().catch(() => null),
        tenantAPI.getSettings().catch(() => null)
      ]);

      setProducts(productsData.data || []);

      // Update user if profile fetch succeeded
      if (userProfile && userProfile.data) {
        setUser(userProfile.data);
        setIsAuthenticated(true); // <--- FIX: This was missing, causing logout on refresh
        localStorage.setItem('user', JSON.stringify(userProfile.data));
      } else {
        // If profile fetch fails but we had a token, the token might be expired
        setIsAuthenticated(false);
      }

      const mappedSales = (salesData.data || []).map(sale => {
        const customer = (customersData.data || []).find(c => c._id === sale.customerId || c.id === sale.customerId);
        return {
          ...sale,
          total: sale.totalAmount || sale.total, // Map backend totalAmount to frontend total
          customerName: customer ? customer.name : (sale.customerId?.name || 'Walk-in Customer'),
          items: (sale.items || []).map(item => ({
            ...item,
            productName: item.productName || (item.product ? item.product.name : 'Unknown Product')
          }))
        };
      });
      setSales(mappedSales);

      setCustomers(customersData.data || []);
      setExpenses(expensesData.data || []);

      if (settingsData && settingsData.data) {
        setSettings(prev => ({
          ...prev,
          ...settingsData.data
        }));
      }

      // After we have a fresh in-memory state, attempt to flush offline-created customers.
      await syncCustomerOutbox();

      addNotification({
        title: 'Backend Connected',
        message: 'Data loaded from backend server',
        type: 'success'
      });

    } catch (error) {
      console.error('Error fetching from backend:', error);
      // Don't fall back to local storage immediately on data fetch error, 
      // as it might be a temporary network blip. Only if backend is totally down (checked in initialize)
      // For now, if major fail, we keep existing state or handle gracefully.
      // IF auth failed (401), the interceptor handles redirect.
    }
  };

  const initializeDefaultData = () => {
    const initialProducts = generateProducts(24);
    const initialCustomers = generateCustomers(15);
    const initialExpenses = generateExpenses(12);

    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setExpenses(initialExpenses);
    setSales(generateSales(initialProducts, initialCustomers, 20));
    setSettings(defaultSettings);
    setNotifications([]);
  };

  // Save to localStorage whenever data changes (offline-first approach)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('sales', JSON.stringify(sales));
    }
  }, [sales, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('customers', JSON.stringify(customers));
    }
  }, [customers, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [expenses, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, loading]);

  // ========== AUTHENTICATION ==========
  const login = async (email, password) => {
    try {
      let userData;
      let token;

      if (useBackendAPI) {
        // Use backend authentication
        const response = await authAPI.login(email, password);
        // Axios throws on non-2xx, so success is implied
        token = response.data.token;
        userData = response.data.user;
      } else {
        // Local authentication
        if (!email || !password) throw new Error('Invalid credentials');

        token = 'demo-token-123';
        userData = {
          _id: '1',
          name: 'Admin User',
          email: email,
          role: 'admin',
          storeName: settings.storeName,
          avatarColor: 'brand.500'
        };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setIsAuthenticated(true);
      setUser(userData);

      if (useBackendAPI) {
        await fetchDataFromBackend();
      }

      addNotification({
        title: 'Welcome Back!',
        message: `You've successfully logged in as ${email}`,
        type: 'success'
      });

      chakraToast({
        title: "Login Successful",
        status: "success",
        duration: 2000,
      });
      return true;

    } catch (error) {
      console.error('Login error:', error);
      // If the backend is unreachable (Render cold start / network), bubble up so UI can show a connection error.
      if (useBackendAPI && (!error.response || error.response?.status === 503)) {
        throw error;
      }
      chakraToast({
        title: "Login Failed",
        description: error.response?.data?.message || 'Invalid credentials',
        status: "error",
        duration: 3000,
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setCart([]);

    chakraToast({
      title: "Logged out successfully",
      status: "info",
      duration: 2000,
    });
  };

  // ========== SETTINGS FUNCTIONS ==========
  const updateSettings = async (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));

    if (user) {
      setUser(prev => ({
        ...prev,
        storeName: newSettings.storeName || prev.storeName
      }));
    }

    localStorage.setItem('settings', JSON.stringify({
      ...settings,
      ...newSettings
    }));

    if (useBackendAPI) {
      try {
        await tenantAPI.updateSettings({ ...settings, ...newSettings });
      } catch (error) {
        console.error('Failed to save settings to backend:', error);
        toast.error('Warning: Failed to sync settings to cloud');
      }
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
  };

  // ========== EXPORT/IMPORT FUNCTIONS ==========
  const exportData = (dataType = 'all') => {
    let dataToExport;

    switch (dataType) {
      case 'products':
        dataToExport = products;
        break;
      case 'customers':
        dataToExport = customers;
        break;
      case 'sales':
        dataToExport = sales;
        break;
      case 'expenses':
        dataToExport = expenses;
        break;
      case 'settings':
        dataToExport = settings;
        break;
      case 'all':
      default:
        dataToExport = {
          products,
          customers,
          sales,
          expenses,
          settings,
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        };
        break;
    }

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `smartpos-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success(`Data exported successfully`);
  };

  const importData = (importedData) => {
    try {
      if (importedData.products && importedData.customers && importedData.sales) {
        setProducts(importedData.products);
        setCustomers(importedData.customers);
        setSales(importedData.sales);
        setExpenses(importedData.expenses || []);

        if (importedData.settings) {
          setSettings(importedData.settings);
        }

        toast.success('All data imported successfully');
        return true;
      }

      if (Array.isArray(importedData) && importedData[0]?.name) {
        setProducts(importedData);
        toast.success('Products imported successfully');
        return true;
      }

      toast.error('Invalid data format for import');
      return false;
    } catch (error) {
      toast.error('Error importing data');
      return false;
    }
  };

  // ========== NOTIFICATION FUNCTIONS ==========
  const addNotification = (notification) => {
    const newNotification = {
      id: crypto.randomUUID(),
      time: 'Just now',
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // ========== EXPENSE FUNCTIONS ==========
  const addExpense = async (expenseData) => {
    try {
      let newExpense;

      if (useBackendAPI) {
        const response = await expenseAPI.create(expenseData);
        newExpense = response.data;
      } else {
        newExpense = {
          ...expenseData,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          approvedBy: user?.name || 'Admin'
        };
      }

      setExpenses(prev => [newExpense, ...prev]);

      addNotification({
        title: 'New Expense Logged',
        message: `₹${expenseData.amount} expense for ${expenseData.category}`,
        type: 'info'
      });

      toast.success("Expense logged successfully");
      return newExpense;

    } catch (error) {
      console.error('Error adding expense:', error);
      chakraToast({
        title: "Failed to add expense",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const updateExpense = async (expenseId, updates) => {
    try {
      let updatedExpense;

      if (useBackendAPI) {
        const response = await expenseAPI.update(expenseId, updates);
        updatedExpense = response.data;
      } else {
        updatedExpense = updates;
      }

      setExpenses(prev => prev.map(expense =>
        expense._id === expenseId || expense.id === expenseId ?
          { ...expense, ...updatedExpense } : expense
      ));

      toast.success("Expense updated");
      return updatedExpense;

    } catch (error) {
      console.error('Error updating expense:', error);
      chakraToast({
        title: "Failed to update expense",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      if (useBackendAPI) {
        await expenseAPI.delete(expenseId);
      }

      setExpenses(prev => prev.filter(expense =>
        expense._id !== expenseId && expense.id !== expenseId
      ));

      toast.success("Expense deleted");

    } catch (error) {
      console.error('Error deleting expense:', error);
      chakraToast({
        title: "Failed to delete expense",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const approveExpense = async (expenseId) => {
    try {
      if (useBackendAPI) {
        const response = await expenseAPI.approve(expenseId, { approvedBy: user?.name });

        setExpenses(prev => prev.map(expense =>
          expense._id === expenseId ? response.data : expense
        ));
      } else {
        setExpenses(prev => prev.map(expense =>
          expense.id === expenseId ? {
            ...expense,
            status: 'Approved',
            approvedBy: user?.name || 'Admin'
          } : expense
        ));
      }

      addNotification({
        title: 'Expense Approved',
        message: 'Expense has been approved successfully',
        type: 'success'
      });

      toast.success("Expense approved");

    } catch (error) {
      console.error('Error approving expense:', error);
      chakraToast({
        title: "Failed to approve expense",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  // ========== PRODUCT FUNCTIONS ==========
  const addProduct = async (newProduct) => {
    try {
      let productWithId;

      if (useBackendAPI) {
        const response = await productAPI.create(newProduct);
        productWithId = response.data;
      } else {
        productWithId = {
          ...newProduct,
          id: crypto.randomUUID(),
          sku: `PROD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          image: newProduct.image || `https://img-wrapper.vercel.app/image?url=https://placehold.co/150?text=${encodeURIComponent(newProduct.name)}`,
          lowStockThreshold: settings.lowStockThreshold
        };
      }

      setProducts(prev => [productWithId, ...prev]);

      addNotification({
        title: 'New Product Added',
        message: `${newProduct.name} added to inventory`,
        type: 'info'
      });

      toast.success("Product added successfully");
      return productWithId;

    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response) {
        console.error('Backend Error Response:', error.response.data);
        console.error('Validation Errors:', error.response.data.errors);
      }
      chakraToast({
        title: "Failed to add product",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      if (useBackendAPI) {
        await productAPI.update(productId, updates);
      }
      setProducts(prev => prev.map(p =>
        p._id === productId || p.id === productId ? { ...p, ...updates } : p
      ));
      toast.success("Product updated");
    } catch (error) {
      console.error("Error updating product:", error);
      chakraToast({
        title: "Failed to update product",
        description: error.response?.data?.message || "Please check the values and try again",
        status: "error",
        duration: 4000,
      });
    }
  };

  const deleteProduct = async (productId) => {
    try {
      if (useBackendAPI) {
        await productAPI.delete(productId);
      }
      setProducts(prev => prev.filter(p =>
        p._id !== productId && p.id !== productId
      ));
      toast.success("Product deleted");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const importProducts = async (file) => {
    try {
      if (useBackendAPI) {
        const formData = new FormData();
        formData.append('file', file); // Multer expects 'file' field
        const response = await productAPI.import(formData);

        // Refresh products to show imported components
        await fetchDataFromBackend();

        toast.success(response.data.message || "Products imported successfully");
        return true;
      }
      return false; // Return false to indicate offline/local mode handling needed
    } catch (error) {
      console.error("Error importing products:", error);
      chakraToast({
        title: "Import Failed",
        description: error.response?.data?.message || "Failed to import products",
        status: "error",
        duration: 5000,
      });
      return false; // Return false so the local CSV fallback can run if needed
    }
  };

  // ========== CUSTOMER FUNCTIONS ==========
  const addCustomer = async (customer) => {
    try {
      let customerWithId;

      if (useBackendAPI) {
        const clientCustomerId = customer?.clientCustomerId || makeClientCustomerId();
        const payload = { ...customer, clientCustomerId };

        try {
          const response = await customerAPI.create(payload);
          customerWithId = response.data;
        } catch (e) {
          // If we are offline or backend is cold-starting, enqueue and show it immediately.
          if (isNetworkishError(e) || e.response?.status === 503) {
            customerWithId = {
              ...payload,
              id: clientCustomerId,
              clientCustomerId,
              totalSpent: 0,
              tier: 'Regular',
              joinDate: new Date().toISOString(),
              lastPurchase: null,
              isOffline: true
            };
            try {
              await enqueueCustomer(customerWithId);
              toast('Saved offline. Will sync when online.');
            } catch (dbErr) {
              // If IndexedDB fails, fall back to local-only behavior.
              console.warn('Failed to enqueue offline customer:', dbErr);
            }
          } else {
            throw e;
          }
        }
      } else {
        customerWithId = {
          ...customer,
          id: crypto.randomUUID(),
          totalSpent: 0,
          tier: 'Regular',
          joinDate: new Date().toISOString(),
          lastPurchase: null
        };
      }

      setCustomers(prev => [customerWithId, ...prev]);

      addNotification({
        title: 'New Customer Registered',
        message: `${customer.name} added to customer list`,
        type: 'info'
      });

      toast.success("Customer added successfully");
      return customerWithId;

    } catch (error) {
      console.error('Error adding customer:', error);
      chakraToast({
        title: "Failed to add customer",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const updateCustomer = async (customerId, updates) => {
    try {
      if (useBackendAPI) {
        await customerAPI.update(customerId, updates);
      }
      setCustomers(prev => prev.map(c =>
        c._id === customerId || c.id === customerId ? { ...c, ...updates } : c
      ));
      toast.success("Customer updated");
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      if (useBackendAPI) {
        await customerAPI.delete(customerId);
      }

      setCustomers(prev => prev.filter(c =>
        c._id !== customerId && c.id !== customerId
      ));

      toast.success("Customer deleted");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const addCustomersBulk = async (newCustomers) => {
    try {
      let addedCustomers = [];

      if (useBackendAPI) {
        // Process in batches of 5 to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < newCustomers.length; i += batchSize) {
          const batch = newCustomers.slice(i, i + batchSize);
          const promises = batch.map(c => customerAPI.create(c).catch(e => {
            console.error('Failed to create customer in bulk:', c.email, e);
            return null;
          }));
          const results = await Promise.all(promises);
          addedCustomers.push(...results.filter(Boolean).map(r => r.data));
        }
      } else {
        addedCustomers = newCustomers.map(c => ({
          ...c,
          id: crypto.randomUUID(),
          totalSpent: 0,
          tier: 'Regular',
          joinDate: new Date().toISOString(),
          lastPurchase: null,
          preferences: c.preferences || { smsNotifications: false, emailNewsletter: true },
          tags: c.tags || []
        }));
      }

      if (addedCustomers.length > 0) {
        setCustomers(prev => [...addedCustomers, ...prev]);

        addNotification({
          title: 'Bulk Import Successful',
          message: `${addedCustomers.length} customers added successfully`,
          type: 'success'
        });

        toast.success(`Successfully imported ${addedCustomers.length} customers`);
      }

      return addedCustomers;

    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error('Failed to import customers');
      // Don't rethrow to avoid crashing UI, just log
      return [];
    }
  };

  // ========== CART FUNCTIONS ==========
  const addToCart = (product) => {
    if (product.stock <= 0) {
      chakraToast({ title: "Out of Stock", status: "error", duration: 2000 });
      return;
    }

    // Check if we already have max stock in cart
    // Check if we already have max stock in cart
    const existingItem = cart.find(item =>
      (item._id && product._id && item._id === product._id) ||
      (item.id && product.id && item.id === product.id)
    );
    if (existingItem && existingItem.quantity >= product.stock) {
      chakraToast({ title: "Max stock reached", status: "warning", duration: 1000 });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item =>
        (item._id && product._id && item._id === product._id) ||
        (item.id && product.id && item.id === product.id)
      );
      if (existing) {
        return prev.map(item =>
          ((item._id && product._id && item._id === product._id) ||
            (item.id && product.id && item.id === product.id))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item =>
      item._id !== productId && item.id !== productId
    ));
    toast.success("Item removed from cart");
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === productId || item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  // ========== SALES FUNCTIONS ==========
  // ========== SALES FUNCTIONS ==========
  const processSale = async (saleDetails) => {
    // Destructure with defaults, falling back to internal calculation if not provided (for older calls compliance, though we will update POS)
    const {
      status = 'completed',
      customerId = null,
      customerName = 'Walk-in Customer',
      paymentMethod = 'cash',
      subtotal = 0,
      discountAmount = 0,
      taxAmount = 0,
      tipAmount = 0,
      total = 0,
      notes = ''
    } = saleDetails;

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Use provided total or fallback to simple calculation (legacy safety)
    let finalTotal = total;
    if (finalTotal === 0) {
      // Fallback calculation if 0 passed (unlikely from updated POS)
      const simpleSub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      finalTotal = simpleSub; // Very basic fallback
    }

    // Validate IDs for Backend
    if (useBackendAPI) {
      const invalidItems = cart.filter(item => {
        const id = item._id || item.id;
        // Simple check for MongoDB ObjectId format (24 hex chars)
        return !id || !/^[0-9a-fA-F]{24}$/.test(id);
      });

      if (invalidItems.length > 0) {
        toast.error("Cart contains offline items. Please clear cart and re-add products.");
        return;
      }
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item._id || item.id,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost || 0, // Include cost price for profit calculation
        productName: item.name,
        discount: item.discount || 0 // Pass per-item discount if available
      })),
      customerId,
      paymentMethod,
      notes,
      subtotal,
      discountAmount,
      taxAmount,
      tipAmount,
      total: finalTotal,
      status
    };

    try {
      let newSale;

      if (useBackendAPI) {
        const response = await saleAPI.create(saleData);
        const data = response.data;
        newSale = {
          ...data,
          total: data.totalAmount || data.total, // Ensure total is present
          customerName: data.customerId?.name || customerName,
          items: data.items.map(item => ({
            ...item,
            productName: item.productId?.name || item.productName
          }))
        };
      } else {
        newSale = {
          ...saleData,
          items: cart.map(item => ({
            product: item._id || item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: (item.price * item.quantity) - ((item.price * item.quantity) * (item.discount || 0) / 100)
          })),
          customer: customerId,
          customerName,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          invoiceNumber: `${settings.invoiceSettings.prefix}-${settings.invoiceSettings.startNumber}`
        };

        // Update invoice number
        updateSettings({
          invoiceSettings: {
            ...settings.invoiceSettings,
            startNumber: settings.invoiceSettings.startNumber + 1
          }
        });
      }

      setSales(prev => [newSale, ...prev]);

      // Update inventory
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c =>
          (c._id && p._id && c._id === p._id) ||
          (c.id && p.id && c.id === p.id)
        );
        if (cartItem) {
          const newStock = p.stock - cartItem.quantity;

          if (settings.enableLowStockAlerts && newStock <= p.lowStockThreshold && newStock > 0) {
            addNotification({
              title: 'Low Stock Alert',
              message: `${p.name} is running low (${newStock} items left)`,
              type: 'alert'
            });
          }

          return { ...p, stock: newStock };
        }
        return p;
      }));

      // Update customer if exists
      if (status === 'completed' && customerId) {
        setCustomers(prev => prev.map(c => {
          if (c._id === customerId || c.id === customerId) {
            const newTotal = c.totalSpent + finalTotal;
            const newTier = calculateTier(newTotal);

            if (c.tier !== newTier && newTier !== 'Regular') {
              addNotification({
                title: 'Customer Tier Upgraded',
                message: `${c.name} upgraded to ${newTier} tier`,
                type: 'success'
              });
            }

            return {
              ...c,
              totalSpent: newTotal,
              tier: newTier,
              lastPurchase: new Date().toISOString()
            };
          }
          return c;
        }));
      }

      // Add notification
      addNotification({
        title: status === 'completed' ? 'New Sale Completed' : 'Order Put on Hold',
        message: `${status === 'completed' ? 'Sale' : 'Order'} for ₹${finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        type: status === 'completed' ? 'success' : 'warning'
      });

      clearCart();
      toast.success(
        status === 'completed'
          ? `Sale completed for ₹${finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
          : `Sale held for ₹${finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      );

      return newSale;

    } catch (error) {
      console.error('Error processing sale:', error);
      chakraToast({
        title: "Failed to process sale",
        description: error.response?.data?.message || 'Please try again',
        status: "error",
        duration: 3000,
      });
      throw error;
    }
  };

  const completePendingSale = async (saleId) => {
    try {
      if (useBackendAPI) {
        const response = await saleAPI.updateStatus(saleId, { status: 'completed' });

        setSales(prev => prev.map(s =>
          s._id === saleId ? response.data : s
        ));
      } else {
        setSales(prev => prev.map(s =>
          s.id === saleId ? {
            ...s,
            status: 'completed',
            date: new Date().toISOString()
          } : s
        ));
      }

      addNotification({
        title: 'Pending Sale Finalized',
        message: 'Sale has been completed',
        type: 'success'
      });

      toast.success("Pending sale finalized");

    } catch (error) {
      console.error('Error completing sale:', error);
      chakraToast({
        title: "Failed to complete sale",
        status: "error",
        duration: 3000,
      });
    }
  };

  const cancelSale = async (saleId) => {
    try {
      const sale = sales.find(s =>
        s._id === saleId || s.id === saleId
      );
      if (!sale) return;

      if (useBackendAPI) {
        await saleAPI.cancel(saleId);
      }

      // Restore stock for local storage
      if (!useBackendAPI) {
        setProducts(prev => prev.map(p => {
          const item = sale.items.find(i =>
            i.product === p._id || i.product === p.id || i.productId === p.id
          );
          if (item) {
            return { ...p, stock: p.stock + item.quantity };
          }
          return p;
        }));

        setSales(prev => prev.filter(s =>
          s._id !== saleId && s.id !== saleId
        ));
      } else {
        setSales(prev => prev.map(s =>
          s._id === saleId ? { ...s, status: 'cancelled' } : s
        ));
      }

      addNotification({
        title: 'Sale Cancelled',
        message: 'Sale has been cancelled',
        type: 'info'
      });

      toast.info("Sale cancelled & stock restored");

    } catch (error) {
      console.error('Error cancelling sale:', error);
      chakraToast({
        title: "Failed to cancel sale",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Helper function
  const calculateTier = (amount) => {
    if (amount > 100000) return 'Platinum';
    if (amount > 50000) return 'Gold';
    if (amount > 10000) return 'Silver';
    return 'Regular';
  };

  // Clear all data
  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to clear ALL data? This cannot be undone!")) {
      try {
        if (useBackendAPI) {
          await adminAPI.resetData();
        }

        localStorage.clear();
        initializeDefaultData();
        setIsAuthenticated(false);
        setUser(null);
        setCart([]);
        setNotifications([]);

        toast.success("All data cleared. Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Error clearing data:', error);
        toast.error('Failed to clear data from server');
      }
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions[permission] === true;
  };

  return (
    <AppContext.Provider value={{
      // Data
      products, sales, cart, customers, expenses, notifications, settings,
      isAuthenticated, user, loading,
      useBackendAPI, // Expose backend status
      refreshData: fetchDataFromBackend, // Expose refresh function

      // Auth
      login, logout, hasPermission,

      // Settings
      updateSettings, resetSettings, exportData, importData, clearAllData,

      // Notifications
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,

      // Cart
      addToCart, removeFromCart, updateCartQuantity, clearCart,

      // Sales
      processSale, completePendingSale, cancelSale,

      // Products
      addProduct, updateProduct, deleteProduct, importProducts,

      // Customers
      addCustomer, updateCustomer, deleteCustomer, addCustomersBulk,

      // Expenses
      addExpense, updateExpense, deleteExpense, approveExpense
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
