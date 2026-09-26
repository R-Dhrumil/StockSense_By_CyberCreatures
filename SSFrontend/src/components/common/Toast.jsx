import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={18} style={{ color: '#10B981' }} />;
        let borderColor = '#10B981';

        if (toast.type === 'error' || toast.type === 'danger') {
          icon = <AlertCircle size={18} style={{ color: '#EF4444' }} />;
          borderColor = '#EF4444';
        } else if (toast.type === 'warning') {
          icon = <AlertCircle size={18} style={{ color: '#F59E0B' }} />;
          borderColor = '#F59E0B';
        } else if (toast.type === 'info') {
          icon = <Info size={18} style={{ color: '#3B82F6' }} />;
          borderColor = '#3B82F6';
        }

        return (
          <div 
            key={toast.id} 
            className="toast" 
            style={{ borderLeft: `4px solid ${borderColor}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              {icon}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  {toast.title || 'Notification'}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>
                  {toast.message}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
