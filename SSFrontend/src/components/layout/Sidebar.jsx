import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Inventory & Catalog',
    items: [
      { name: 'Products', path: '/products', icon: Package, badge: '2 Low' },
      { name: 'Categories', path: '/categories', icon: Layers },
      { name: 'Inventory', path: '/inventory', icon: Boxes },
      { name: 'Stock Movements', path: '/movements', icon: ArrowLeftRight }
    ]
  },
  {
    title: 'Fulfillment & Logistics',
    items: [
      { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
      { name: 'Suppliers', path: '/suppliers', icon: Truck },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
      { name: 'Sales Orders', path: '/sales-orders', icon: TrendingUp }
    ]
  },
  {
    title: 'Intelligence & Admin',
    items: [
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { name: 'Users & Roles', path: '/users', icon: Users },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) {
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
          <div className="sidebar-logo">
            <img 
              src="/favicon.svg" 
              alt="StockSense" 
              style={{ width: 26, height: 26, objectFit: 'contain' }} 
            />
          </div>

          <div className="sidebar-brand">
            <span className="sidebar-brand-name">StockSense</span>
            <span className="sidebar-brand-sub">by CyberCreatures</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ marginLeft: 'auto' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              <div className="sidebar-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
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
                    {item.badge && !collapsed && (
                      <span className="nav-item-badge">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '12px',
            flexShrink: 0
          }}>
            SS
          </div>
          <div className="sidebar-footer-info" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-neutral-200)', whiteSpace: 'nowrap' }}>
              StockSense v2.4
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', whiteSpace: 'nowrap' }}>
              Connected: 4 Hubs
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
