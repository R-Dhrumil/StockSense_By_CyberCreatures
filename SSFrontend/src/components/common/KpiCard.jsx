import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendDirection = 'up',
  variant = 'primary'
}) {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-header">
        <div className={`kpi-icon ${variant}`}>
          {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <div className={`kpi-trend ${trendDirection}`}>
            {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{title}</div>
      </div>

      {subtext && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', marginTop: '2px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
