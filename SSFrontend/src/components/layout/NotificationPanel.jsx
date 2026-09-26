import React from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Bell, 
  ArrowRight,
  PackageCheck
} from 'lucide-react';

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onNotificationClick
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div className="notification-panel" role="dialog" aria-modal="true" aria-label="Notifications panel">
        {/* Header */}
        <div className="notification-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--color-primary-600)' }} />
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>
              System Alerts & Notifications
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onMarkAllAsRead}
              style={{ fontSize: '11px', color: 'var(--color-primary-600)' }}
            >
              Mark all read
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
              <PackageCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>All caught up!</p>
              <p style={{ fontSize: 'var(--font-size-xs)' }}>No pending inventory or order alerts.</p>
            </div>
          ) : (
            notifications.map((item) => {
              let Icon = Info;
              let iconBg = 'var(--color-info-50)';
              let iconColor = 'var(--color-info-600)';

              if (item.type === 'danger') {
                Icon = AlertTriangle;
                iconBg = 'var(--color-danger-50)';
                iconColor = 'var(--color-danger-600)';
              } else if (item.type === 'warning') {
                Icon = AlertTriangle;
                iconBg = 'var(--color-warning-50)';
                iconColor = 'var(--color-warning-600)';
              } else if (item.type === 'success') {
                Icon = CheckCircle2;
                iconBg = 'var(--color-success-50)';
                iconColor = 'var(--color-success-600)';
              }

              return (
                <div
                  key={item.id}
                  className={`notification-item ${item.unread ? 'unread' : ''}`}
                  onClick={() => onNotificationClick && onNotificationClick(item)}
                >
                  <div
                    className="notification-icon"
                    style={{ background: iconBg, color: iconColor }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="notification-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                        {item.title}
                      </span>
                      <span className="notification-time">{item.time}</span>
                    </div>
                    <div className="notification-text" style={{ fontSize: 'var(--font-size-xs)', marginTop: '2px' }}>
                      {item.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-50)', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
            Real-time webhook updates active via WebSocket
          </span>
        </div>
      </div>
    </>
  );
}
