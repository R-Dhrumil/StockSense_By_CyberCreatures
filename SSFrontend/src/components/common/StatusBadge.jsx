import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Truck, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';

export default function StatusBadge({ status, type = 'stock', size = 'md' }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let badgeClass = 'badge-neutral';
  let icon = null;

  // Stock status
  if (['in stock', 'operational', 'active', 'delivered', 'received', 'paid', 'done'].includes(normalized)) {
    badgeClass = 'badge-success';
    icon = <CheckCircle2 size={13} className="shrink-0" />;
  } else if (['low stock', 'near capacity', 'partially received', 'allocated', 'picked', 'pending', 'ready'].includes(normalized)) {
    badgeClass = 'badge-warning';
    icon = <AlertTriangle size={13} className="shrink-0" />;
  } else if (['out of stock', 'critical', 'cancelled', 'unpaid', 'overdue'].includes(normalized)) {
    badgeClass = 'badge-danger';
    icon = <XCircle size={13} className="shrink-0" />;
  } else if (['ordered', 'dispatched', 'in transit', 'packed'].includes(normalized)) {
    badgeClass = 'badge-info';
    icon = <Truck size={13} className="shrink-0" />;
  } else if (['draft', 'archived', 'waiting'].includes(normalized)) {
    badgeClass = 'badge-neutral';
    icon = <Clock size={13} className="shrink-0" />;
  } else if (['admin', 'manager', 'received goods'].includes(normalized)) {
    badgeClass = 'badge-primary';
    icon = <ShieldCheck size={13} className="shrink-0" />;
  }

  // Stock Movement types
  if (normalized === 'received') {
    badgeClass = 'badge-success';
    icon = <ArrowDownLeft size={13} className="shrink-0" />;
  } else if (normalized === 'issued') {
    badgeClass = 'badge-info';
    icon = <ArrowUpRight size={13} className="shrink-0" />;
  } else if (normalized === 'adjusted') {
    badgeClass = 'badge-warning';
    icon = <RefreshCw size={13} className="shrink-0" />;
  } else if (normalized === 'transferred') {
    badgeClass = 'badge-primary';
    icon = <Package size={13} className="shrink-0" />;
  } else if (normalized === 'returned') {
    badgeClass = 'badge-danger';
    icon = <XCircle size={13} className="shrink-0" />;
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'text-xs' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      {icon}
      <span>{status}</span>
    </span>
  );
}
