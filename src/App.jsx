import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChakraProvider, Flex, Spinner } from '@chakra-ui/react';
import theme from './theme';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import AdminQueries from './pages/AdminQueries';
import BotSettings from './pages/BotSettings';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster, toast } from 'react-hot-toast';
import Feedback from './pages/Feedback'; // [FEATURE #10]
import Campaigns from './pages/Campaigns'; // [FEATURE #11 & #18]
import Suppliers from './pages/Suppliers'; // [FEATURE #7]
import PurchaseOrders from './pages/PurchaseOrders'; // [FEATURE #7]
import AccountsPayable from './pages/AccountsPayable'; // [FEATURE #14]
import Payroll from './pages/Payroll'; // [FEATURE #15]
import BankReconciliation from './pages/BankReconciliation'; // [FEATURE #16]
import MallEvents from './pages/MallEvents'; // [FEATURE #22]
import PublicPortal from './pages/PublicPortal'; // [FEATURE] Public portal
import PublicStoreCatalog from './pages/PublicStoreCatalog';
import PublicStorePortal from './pages/PublicStorePortal';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports'; // [FEATURE #6] Analytics & Reports

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Restricted Route Component (For Cashiers)
const RestrictedRoute = ({ children }) => {
  const { user } = useApp();
  const location = useLocation();

  if (user?.role === 'cashier') {
    const allowedPaths = ['/pos', '/sales', '/login'];
    // Check if current path starts with any allowed path (e.g. /sales/123)
    const isAllowed = allowedPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

    if (!isAllowed) {
      // Use useEffect or ensure this doesn't cause infinite loops if rendering directly
      // We return a Navigate component instead of calling navigate() directly during render
      toast.error('Restricted Activity: Access Denied', { id: 'restricted-toast' });
      return <Navigate to="/pos" replace />;
    }
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useApp();

  const PortalStoreRedirect = () => {
    const { tenantId } = useParams();
    return <Navigate to={`/portal/${tenantId}`} replace />;
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/portal" element={
          <PublicPortal />
        } />

        <Route path="/portal/:tenantId" element={<PublicStorePortal />} />
        <Route path="/portal/store/:tenantId" element={<PortalStoreRedirect />} />
        <Route path="/portal/store/:tenantId/catalog" element={<PublicStoreCatalog />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard is restricted for Cashiers, they go to POS default if they hit root */}
          <Route index element={
            user?.role === 'cashier' ? <Navigate to="/pos" replace /> : <Dashboard />
          } />

          <Route path="pos" element={<POS />} />
          <Route path="sales" element={<Sales />} />

          {/* Restricted Routes */}
          <Route path="inventory" element={<RestrictedRoute><Inventory /></RestrictedRoute>} />
          <Route path="customers" element={<RestrictedRoute><Customers /></RestrictedRoute>} />
          <Route path="suppliers" element={<RestrictedRoute><Suppliers /></RestrictedRoute>} /> {/* [FEATURE #7] */}
          <Route path="purchase-orders" element={<RestrictedRoute><PurchaseOrders /></RestrictedRoute>} /> {/* [FEATURE #7] */}
          <Route path="accounts-payable" element={<RestrictedRoute><AccountsPayable /></RestrictedRoute>} /> {/* [FEATURE #14] */}
          <Route path="payroll" element={<RestrictedRoute><Payroll /></RestrictedRoute>} /> {/* [FEATURE #15] */}
          <Route path="bank-reconciliation" element={<RestrictedRoute><BankReconciliation /></RestrictedRoute>} /> {/* [FEATURE #16] */}
          <Route path="events" element={<RestrictedRoute><MallEvents /></RestrictedRoute>} /> {/* [FEATURE #22] */}
          <Route path="feedback" element={<RestrictedRoute><Feedback /></RestrictedRoute>} /> {/* [FEATURE #10] */}
          <Route path="campaigns" element={<RestrictedRoute><Campaigns /></RestrictedRoute>} /> {/* [FEATURE #11 & #18] */}
          <Route path="expenses" element={<RestrictedRoute><Expenses /></RestrictedRoute>} />
          <Route path="users" element={<RestrictedRoute><UserManagement /></RestrictedRoute>} />
          <Route path="admin/queries" element={<RestrictedRoute><AdminQueries /></RestrictedRoute>} />
          <Route path="admin/bot-settings" element={<RestrictedRoute><BotSettings /></RestrictedRoute>} />
          <Route path="settings" element={<RestrictedRoute><Settings /></RestrictedRoute>} />
          <Route path="notifications" element={<RestrictedRoute><Notifications /></RestrictedRoute>} />
          <Route path="reports" element={<RestrictedRoute><Reports /></RestrictedRoute>} /> {/* [FEATURE #6] Analytics & Reports */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
                color: '#fff',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            },
          }}
        />
        <AppContent />
      </AppProvider>
    </ChakraProvider>
  );
}

export default App;
