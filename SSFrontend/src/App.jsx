import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import NotificationPanel from './components/layout/NotificationPanel';
import Toast from './components/common/Toast';
import Modal from './components/common/Modal';

// 13 Screens
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Warehouses from './pages/Warehouses';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import SalesOrders from './pages/SalesOrders';
import StockMovements from './pages/StockMovements';
import Reports from './pages/Reports';
import UsersManagement from './pages/UsersManagement';
import Settings from './pages/Settings';

import { INITIAL_PRODUCTS, DEFAULT_NOTIFICATIONS, INITIAL_WAREHOUSES } from './data/mockData';
import { api, authApi, productApi, warehouseApi } from './services/api';
import { subscribeToEvent, initSocket } from './services/socket';
import './App.css';

export default function App() {
  const storedUser = api.getCurrentUser();
  const storedToken = api.getToken();

  const [currentUser, setCurrentUser] = useState(
    storedUser || {
      id: 'USR-01',
      name: 'Sarah Jenkins',
      email: 's.jenkins@stocksense.io',
      role: 'INVENTORY_MANAGER',
      avatar: 'SJ'
    }
  );
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedToken || storedUser));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeWarehouse, setActiveWarehouse] = useState('All');
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isWarehousesLoading, setIsWarehousesLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Toast notifier helper
  const addToast = (title, message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshProductsList = () => {
    productApi.getProducts()
      .then(res => {
        if (res?.data?.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        }
      })
      .catch(() => {});
  };

  // Fetch live products and warehouses on startup
  useEffect(() => {
    if (isAuthenticated) {
      refreshProductsList();

      setIsWarehousesLoading(true);
      warehouseApi.getWarehouses()
        .then(res => {
          if (res?.data?.warehouses && res.data.warehouses.length > 0) {
            setWarehouses(res.data.warehouses);
          }
        })
        .catch(err => {
          console.warn('Initial warehouses fetch in App fallback:', err.message);
        })
        .finally(() => {
          setIsWarehousesLoading(false);
        });
    } else {
      setIsProductsLoading(false);
      setIsWarehousesLoading(false);
    }
  }, [isAuthenticated]);

  // Real-Time Telemetry & Socket Alerts (Module 10)
  useEffect(() => {
    if (!isAuthenticated) return;

    initSocket();

    // 1. Critical Low-Stock Alert
    const unsubLowStock = subscribeToEvent('alert:low_stock', (data) => {
      const newNotification = {
        id: `notif-${Date.now()}`,
        title: data.severity === 'CRITICAL' ? 'Critical Out of Stock' : 'Low Stock Warning',
        message: data.message || `Item ${data.productName || data.productId} reached low threshold (${data.currentStock} units left).`,
        type: data.severity === 'CRITICAL' ? 'danger' : 'warning',
        timestamp: 'Just now',
        unread: true,
      };

      setNotifications(prev => [newNotification, ...prev]);
      addToast(newNotification.title, newNotification.message, newNotification.type === 'danger' ? 'error' : 'warning');
      refreshProductsList();
    });

    // 2. Stock Balance Movement / Change
    const unsubStockChanged = subscribeToEvent('stock:changed', () => {
      refreshProductsList();
    });

    const unsubStockUpdated = subscribeToEvent('stock:updated', () => {
      refreshProductsList();
    });

    // 3. Inbound Receipt Validated
    const unsubReceipt = subscribeToEvent('receipt:validated', (data) => {
      const opNum = data.receipt?.operationNumber || 'Receipt';
      addToast('Inbound Shipment Received', `${opNum} successfully checked in and added to stock.`, 'success');
      refreshProductsList();
    });

    // 4. Outbound Delivery Validated
    const unsubDelivery = subscribeToEvent('delivery:validated', (data) => {
      const opNum = data.delivery?.operationNumber || 'Delivery';
      addToast('Order Dispatched', `${opNum} dispatched to carrier and stock ledger updated.`, 'info');
      refreshProductsList();
    });

    // 5. Transfer Validated
    const unsubTransfer = subscribeToEvent('transfer:validated', (data) => {
      const opNum = data.transfer?.operationNumber || 'Transfer';
      addToast('Internal Transfer Completed', `${opNum} inventory relocated.`, 'info');
      refreshProductsList();
    });

    return () => {
      unsubLowStock();
      unsubStockChanged();
      unsubStockUpdated();
      unsubReceipt();
      unsubDelivery();
      unsubTransfer();
    };
  }, [isAuthenticated]);

  // Dynamic live low stock count
  const lowStockCount = useMemo(() => {
    return products.filter(p => 
      p.status === 'Low Stock' || 
      p.status === 'Out of Stock' || 
      (Number(p.availableQty ?? 0) <= Number(p.reorderLevel ?? 0))
    ).length;
  }, [products]);


  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    addToast('Welcome to StockSense', `Signed in as ${user.name} (${user.role}).`, 'success');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      api.clearAuth();
    }
    setIsAuthenticated(false);
    navigate('/login');
    addToast('Signed Out', 'You have been safely signed out.', 'info');
  };

  const handleRoleChange = (newRole) => {
    setCurrentUser(prev => ({ ...prev, role: newRole }));
    addToast('Role Switched', `Simulating ${newRole} experience. Permissions updated.`, 'info');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Quick Action Handler from Topbar / Dashboard
  const handleQuickAction = (type) => {
    const ts = Date.now();
    if (type === 'product') {
      navigate('/products', { state: { openModal: 'product', ts } });
    } else if (type === 'adjustment') {
      navigate('/inventory', { state: { openModal: 'adjustment', ts } });
    } else if (type === 'po') {
      navigate('/purchase-orders', { state: { openModal: 'po', ts } });
    } else if (type === 'so') {
      navigate('/sales-orders', { state: { openModal: 'so', ts } });
    }
  };

  const isLoginPage = location.pathname === '/login' || !isAuthenticated;

  // Unread notification count
  const unreadCount = notifications.filter(n => n.unread).length;

  if (isLoginPage) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={handleDismissToast} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="app-layout">
      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Slide-out Notification Drawer */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
        onNotificationClick={(notif) => {
          setIsNotificationOpen(false);
          if (notif.title.includes('Stock')) navigate('/inventory');
          else if (notif.title.includes('PO')) navigate('/purchase-orders');
        }}
      />

      {/* Main Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        lowStockCount={lowStockCount}
        currentUser={currentUser}
      />

      {/* Main Content Layout Wrapper */}
      <div className={`app-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sticky Topbar */}
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          activeWarehouse={activeWarehouse}
          onChangeWarehouse={(val) => {
            setActiveWarehouse(val);
            addToast('Warehouse Switched', `Filtered view to ${val}.`, 'info');
          }}
          currentUser={currentUser}
          onChangeRole={handleRoleChange}
          onLogout={handleLogout}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadCount={unreadCount}
          onOpenQuickAction={handleQuickAction}
          warehouseList={warehouses}
        />

        {/* Dynamic Route Content */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  currentUser={currentUser}
                  onOpenQuickAction={handleQuickAction}
                />
              }
            />
            <Route
              path="/products"
              element={
                <Products
                  products={products}
                  setProducts={setProducts}
                  warehouses={warehouses}
                  onNotify={addToast}
                  currentUser={currentUser}
                  isLoading={isProductsLoading}
                />
              }
            />
            <Route
              path="/categories"
              element={<Categories onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/inventory"
              element={
                <Inventory
                  products={products}
                  setProducts={setProducts}
                  warehouses={warehouses}
                  onNotify={addToast}
                  activeWarehouse={activeWarehouse}
                  onChangeWarehouse={setActiveWarehouse}
                  currentUser={currentUser}
                  isLoading={isProductsLoading}
                />
              }
            />
            <Route
              path="/warehouses"
              element={
                <Warehouses 
                  onNotify={addToast} 
                  currentUser={currentUser} 
                  isLoading={isWarehousesLoading}
                />
              }
            />
            <Route
              path="/suppliers"
              element={<Suppliers onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/purchase-orders"
              element={
                <PurchaseOrders
                  onNotify={addToast}
                  products={products}
                  setProducts={setProducts}
                  warehouses={warehouses}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/sales-orders"
              element={<SalesOrders onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/movements"
              element={<StockMovements onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/reports"
              element={<Reports onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/users"
              element={<UsersManagement onNotify={addToast} currentUser={currentUser} />}
            />
            <Route
              path="/settings"
              element={<Settings onNotify={addToast} currentUser={currentUser} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
