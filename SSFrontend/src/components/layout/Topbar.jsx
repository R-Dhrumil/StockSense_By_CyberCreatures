import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Warehouse,
  Shield,
  LogOut,
  UserCheck,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  Send,
  Check
} from 'lucide-react';
import { hasPermission, normalizeRole, ROLE_LABELS, ROLES } from '../../utils/permissions';

export default function Topbar({
  sidebarCollapsed,
  onToggleMobileSidebar,
  activeWarehouse,
  onChangeWarehouse,
  currentUser,
  onChangeRole,
  onLogout,
  onOpenNotifications,
  unreadCount = 2,
  onOpenQuickAction
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const userMenuRef = useRef(null);
  const quickActionRef = useRef(null);
  const navigate = useNavigate();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target)) {
        setQuickActionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGlobalSearchSubmit = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="topbar-icon-btn mobile-menu-btn"
        onClick={onToggleMobileSidebar}
        aria-label="Open mobile navigation menu"
        style={{ display: 'none' }}
      >
        <Menu size={20} />
      </button>

      {/* Global Search Bar */}
      <div className="topbar-search">
        <Search size={18} className="topbar-search-icon" />
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search products, SKUs, purchase orders, suppliers... (Press Enter)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onKeyDown={handleGlobalSearchSubmit}
          aria-label="Global inventory search"
        />
        <span className="topbar-search-kbd">⌘K</span>
      </div>

      {/* Warehouse Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Warehouse size={16} style={{ color: 'var(--color-primary-600)' }} />
        <select
          value={activeWarehouse}
          onChange={(e) => onChangeWarehouse(e.target.value)}
          className="form-select"
          style={{ height: '36px', fontSize: 'var(--font-size-xs)', padding: '0 28px 0 10px', minWidth: '160px' }}
          aria-label="Select Active Warehouse"
        >
          <option value="All">All Warehouses (Global)</option>
          {warehouseList.length > 0 ? (
            warehouseList.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name} ({w.code})
              </option>
            ))
          ) : (
            <>
              <option value="Main Central Hub">Main Central Hub (WH-MAIN)</option>
              <option value="Production Facility East">Production Facility East (WH-PROD)</option>
              <option value="Southern Logistics Depot">Southern Logistics Depot (WH-SOUTH)</option>
            </>
          )}
        </select>
      </div>

      {/* Topbar Right Actions */}
      <div className="topbar-actions">
        {/* Quick Action Dropdown */}
        <div className="dropdown" ref={quickActionRef}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Quick Action</span>
            <ChevronDown size={14} />
          </button>

          {quickActionOpen && (
            <div className="dropdown-menu" style={{ width: '230px' }}>
              {hasPermission.canManageProducts(userRole) && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setQuickActionOpen(false);
                    onOpenQuickAction('product');
                  }}
                >
                  <PackagePlus size={16} style={{ color: 'var(--color-primary-600)' }} />
                  <span>Add New Product</span>
                </button>
              )}

              {hasPermission.canEnterAdjustments(userRole) && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setQuickActionOpen(false);
                    onOpenQuickAction('adjustment');
                  }}
                >
                  <RefreshCw size={16} style={{ color: 'var(--color-warning-600)' }} />
                  <span>
                    {userRole === ROLES.STAFF ? 'Physical Count Entry' : 'Record Stock Adjustment'}
                  </span>
                </button>
              )}

              {hasPermission.canCreateReceipts(userRole) && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setQuickActionOpen(false);
                    onOpenQuickAction('po');
                  }}
                >
                  <ShoppingCart size={16} style={{ color: 'var(--color-info-600)' }} />
                  <span>Create Purchase Order</span>
                </button>
              )}

              {hasPermission.canCreateDeliveries(userRole) && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setQuickActionOpen(false);
                    onOpenQuickAction('so');
                  }}
                >
                  <Send size={16} style={{ color: 'var(--color-success-600)' }} />
                  <span>New Sales Order</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onOpenNotifications}
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="badge-dot" />}
        </button>

        <div className="topbar-divider" />

        {/* User Profile & Role Switcher */}
        <div className="dropdown" ref={userMenuRef}>
          <div
            className="topbar-user"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            role="button"
            tabIndex={0}
            aria-label="User account menu"
          >
            <div className="topbar-avatar">
              {currentUser?.avatar || 'AV'}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{currentUser?.name || 'User'}</span>
              <span className="topbar-user-role">{ROLE_LABELS[userRole] || currentUser?.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-neutral-400)' }} />
          </div>

          {userMenuOpen && (
            <div className="dropdown-menu" style={{ width: '260px' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-neutral-100)' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                  Signed in as
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '2px 0 0' }}>
                  {currentUser?.email}
                </p>
              </div>

              {/* Role Switcher Section for Demoing / Testing */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Shield size={13} style={{ color: 'var(--color-primary-600)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-neutral-600)' }}>
                    Switch Active Role
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
                    const isSelected = userRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => {
                          onChangeRole?.(roleKey);
                          setUserMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--color-primary-300)' : '1px solid transparent',
                          background: isSelected ? 'var(--color-primary-50)' : 'transparent',
                          color: isSelected ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span>{label}</span>
                        {isSelected && <Check size={14} style={{ color: 'var(--color-primary-600)' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasPermission.canManageSettings(userRole) && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  <Shield size={16} />
                  <span>System Settings</span>
                </button>
              )}

              <button
                type="button"
                className="dropdown-item"
                style={{ color: 'var(--color-danger-600)' }}
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
