import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Package
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { INITIAL_STOCK_MOVEMENTS } from '../data/mockData';
import { normalizeRole } from '../utils/permissions';

export default function StockMovements({ onNotify, currentUser }) {
  const currentRole = normalizeRole(currentUser?.role);
  const [movements, setMovements] = useState(INITIAL_STOCK_MOVEMENTS);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const columns = [
    {
      header: 'Audit ID & Timestamp',
      accessor: 'id',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-neutral-900)' }}>{row.id}</span>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.date}</div>
        </div>
      )
    },
    {
      header: 'Movement Type',
      accessor: 'type',
      render: (row) => <StatusBadge status={row.type} type="movement" />
    },
    {
      header: 'Product & SKU',
      accessor: 'product',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>{row.product}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-neutral-400)' }}>{row.sku}</div>
        </div>
      )
    },
    {
      header: 'Net Change Qty',
      accessor: 'qty',
      render: (row) => {
        const isPositive = row.qty > 0;
        return (
          <span
            style={{
              fontWeight: 800,
              fontSize: 'var(--font-size-base)',
              color: isPositive ? 'var(--color-success-600)' : 'var(--color-danger-600)'
            }}
          >
            {isPositive ? `+${row.qty}` : row.qty}
          </span>
        );
      }
    },
    {
      header: 'Source Origin → Destination Hub',
      accessor: 'source',
      render: (row) => (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-700)' }}>
          <span style={{ fontWeight: 500 }}>{row.source}</span>
          <span style={{ margin: '0 6px', color: 'var(--color-neutral-400)' }}>→</span>
          <span style={{ fontWeight: 500 }}>{row.destination}</span>
        </div>
      )
    },
    {
      header: 'Reference Doc',
      accessor: 'reference',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', background: 'var(--color-neutral-100)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
          {row.reference}
        </span>
      )
    },
    {
      header: 'Auditor / User',
      accessor: 'user',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>
          {row.user}
        </span>
      )
    }
  ];

  const filterOptions = [
    { label: 'Received', value: 'Received' },
    { label: 'Issued', value: 'Issued' },
    { label: 'Adjusted', value: 'Adjusted' },
    { label: 'Transferred', value: 'Transferred' },
    { label: 'Returned', value: 'Returned' }
  ];

  return (
    <div className="stock-movements-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Audit & Compliance</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Stock Movements</span>
          </div>
          <h1 className="page-title">Immutable Stock Movement Ledger</h1>
          <p className="page-subtitle">
            Complete audit-friendly history of every item received, issued, adjusted, returned, and transferred.
          </p>
        </div>

        <div className="page-header-actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-success-50)', color: 'var(--color-success-700)', padding: '6px 12px', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
            <CheckCircle2 size={15} />
            <span>Audit Integrity Verified (256-bit SHA)</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={movements}
        searchPlaceholder="Filter by SKU, product, PO/SO reference, or operator..."
        filterOptions={filterOptions}
        filterKey="type"
        onRowClick={(row) => setSelectedMovement(row)}
      />

      {/* Detail Modal */}
      {selectedMovement && (
        <Modal
          isOpen={!!selectedMovement}
          onClose={() => setSelectedMovement(null)}
          title={`Movement Record: ${selectedMovement.id}`}
          subtitle={`Reference: ${selectedMovement.reference} • ${selectedMovement.date}`}
          size="md"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedMovement(null)}
            >
              Close Ledger
            </button>
          }
        >
          <div className="detail-section">
            <h4 className="detail-section-title">Audit Record Summary</h4>
            <div className="detail-row">
              <div className="detail-label">Action Classification:</div>
              <div className="detail-value"><StatusBadge status={selectedMovement.type} type="movement" /></div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Product Name:</div>
              <div className="detail-value font-semibold">{selectedMovement.product}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">SKU Identifier:</div>
              <div className="detail-value" style={{ fontFamily: 'monospace' }}>{selectedMovement.sku}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Quantity Impact:</div>
              <div className="detail-value font-bold" style={{ color: selectedMovement.qty > 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                {selectedMovement.qty > 0 ? `+${selectedMovement.qty}` : selectedMovement.qty} units
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Origin Point:</div>
              <div className="detail-value">{selectedMovement.source}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Destination Point:</div>
              <div className="detail-value">{selectedMovement.destination}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Responsible Operator:</div>
              <div className="detail-value font-semibold">{selectedMovement.user}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Documented Reason:</div>
              <div className="detail-value">{selectedMovement.reason || 'Standard system transaction.'}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
