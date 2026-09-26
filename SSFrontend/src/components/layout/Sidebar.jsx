import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  Truck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import logoDarkSvg from '../../assets/logo-dark.svg';
import faviconSvg from '../../assets/fevicon.svg';
import { normalizeRole, ROLE_LABELS } from '../../utils/permissions';

const ALL_NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] }
    ]
  },
  {
    title: 'Inventory & Catalog',
    items: [
      { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
      { name: 'Categories', path: '/categories', icon: Layers, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
      { name: 'Inventory', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
      { name: 'Stock Movements', path: '/movements', icon: ArrowLeftRight, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] }
    ]
  },
  {
    title: 'Fulfillment & Logistics',
    items: [
      { name: 'Warehouses', path: '/warehouses', icon: Warehouse, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
      { name: 'Sales Orders', path: '/sales-orders', icon: TrendingUp, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] }
    ]
  },
  {
    title: 'Intelligence & Admin',
    items: [
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { name: 'Users & Roles', path: '/users', icon: Users, roles: ['ADMIN'] },
      { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] }
    ]
  }
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  lowStockCount = 0,
  currentUser
}) {
  const navigate = useNavigate();
  const currentRole = normalizeRole(currentUser?.role);

  const visibleNavGroups = ALL_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(currentRole))
  })).filter(group => group.items.length > 0);
  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            {collapsed ? (
              <img 
                src={faviconSvg} 
                alt="StockSense" 
                className="sidebar-collapsed-logo" 
              />
            ) : (
              <img 
                src={logoDarkSvg} 
                alt="StockSense by CyberCreatures" 
                className="sidebar-full-logo" 
              />
            )}
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {visibleNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              <div className="sidebar-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const dynamicBadge = (item.path === '/products' && lowStockCount > 0)
                  ? `${lowStockCount} Low`
                  : item.badge;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={19} className="nav-item-icon" />
                    <span className="nav-item-text">{item.name}</span>
                    {dynamicBadge && !collapsed && (
                      <span
                        className="nav-item-badge"
                        title={`Click to view ${dynamicBadge} items`}
                        onClick={(e) => {
                          if (item.path === '/products') {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/products', { state: { filterStatus: 'low', ts: Date.now() } });
                            if (onCloseMobile) onCloseMobile();
                          }
                        }}
                      >
                        {dynamicBadge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Role Badge */}
        <div className="sidebar-footer">
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-md)',
            background: currentRole === 'ADMIN' ? 'rgba(59, 130, 246, 0.2)' : (currentRole === 'INVENTORY_MANAGER' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
            color: currentRole === 'ADMIN' ? '#60A5FA' : (currentRole === 'INVENTORY_MANAGER' ? '#FBBF24' : '#34D399'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {currentRole === 'ADMIN' ? <Shield size={16} /> : (currentRole === 'INVENTORY_MANAGER' ? <Package size={16} /> : <Truck size={16} />)}
          </div>
          <div className="sidebar-footer-info" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-neutral-200)', whiteSpace: 'nowrap' }}>
              {ROLE_LABELS[currentRole] || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>
              {currentRole === 'ADMIN' ? 'Full System Access' : (currentRole === 'INVENTORY_MANAGER' ? 'Stock & Operations' : 'Transfers & Counting')}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
