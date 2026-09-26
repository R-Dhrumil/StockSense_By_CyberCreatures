import React, { useState, useEffect, useCallback } from 'react';
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
  Package,
  Layers,
  FileText
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

import { normalizeRole } from '../utils/permissions';
import { ledgerApi } from '../services/api';

export default function StockMovements({ onNotify, currentUser }) {
  const currentRole = normalizeRole(currentUser?.role);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Load live ledger records from Backend
  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ledgerApi.getLedger({ operationType: typeFilter !== 'ALL' ? typeFilter : undefined });
      if (res?.data?.ledger && res.data.ledger.length > 0) {
        const formatted = res.data.ledger.map(m => ({
          id: m.id || m.reference,
          date: m.timestamp ? new Date(m.timestamp).toISOString().slice(0, 10) : '2026-03-24',
          type: m.type || (m.moveType === 'RECEIPT' ? 'Received' : m.moveType === 'DELIVERY' ? 'Delivered' : m.moveType === 'INTERNAL' ? 'Transferred' : m.moveType === 'ADJUSTMENT' ? 'Adjusted' : m.moveType),
          product: m.productName || m.product_name || 'Product Item',
          sku: m.sku || 'SKU-001',
          qty: m.quantityChange !== undefined ? m.quantityChange : (m.quantity_change || 0),
          balanceAfter: m.balanceAfter ?? m.balance_after ?? 0,
          source: m.sourceLocation || 'Warehouse Main',
          destination: m.destLocation || 'Production Rack',
          reference: m.reference || m.reference_number || 'TRX-001',
          user: m.user || 'System Auditor',
          reason: m.reason || m.notes || 'Routine inventory update'
        }));
        setMovements(formatted);
      } else {
        setMovements([]);
      }
    } catch (err) {
      console.warn('Backend ledger unavailable:', err.message);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Handle CSV Export
  const handleExportCSV = () => {
    window.open(ledgerApi.exportLedgerUrl(), '_blank');
    onNotify('Export Initiated', 'Stock ledger CSV download started.', 'info');
  };

  const columns = [
    {
      header: 'Audit ID & Date',
      accessor: 'id',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-neutral-900)' }}>
            {row.id?.length > 15 ? `${row.id.slice(0, 10)}...` : row.id}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.date}</div>
        </div>
      )
    },
    {
      header: 'Operation Type',
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
      header: 'Net Delta (+/-)',
      accessor: 'qty',
      render: (row) => {
        const isPositive = Number(row.qty) > 0;
        const isZero = Number(row.qty) === 0;
        return (
          <span
            style={{
              fontWeight: 800,
              fontSize: 'var(--font-size-base)',
              color: isZero ? 'var(--color-primary-600)' : (isPositive ? 'var(--color-success-600)' : 'var(--color-danger-600)')
            }}
          >
            {isZero ? '0 (Transfer)' : (isPositive ? `+${row.qty}` : row.qty)}
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
      header: 'Auditor / Operator',
      accessor: 'user',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>
          {row.user}
        </span>
      )
    }
  ];

  const filterOptions = [
    { label: 'All Operations', value: '' },
    { label: 'Received (Receipts)', value: 'Received' },
    { label: 'Delivered (Deliveries)', value: 'Delivered' },
    { label: 'Adjusted (Physical Counts)', value: 'Adjusted' },
    { label: 'Transferred (Internal)', value: 'Transferred' }
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
          <h1 className="page-title">Move History & Central Stock Ledger (Module 8)</h1>
          <p className="page-subtitle">
            Immutable, real-time audit trail of every single inventory change: Inbound Receipts, Outbound Deliveries, Internal Transfers, and Physical Adjustments.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadLedger}
            title="Refresh Ledger"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportCSV}
          >
            <Download size={15} />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={movements}
        searchPlaceholder="Filter by SKU, product name, PO/SO/TRF/ADJ reference, or auditor..."
        filterOptions={filterOptions}
        filterKey="type"
        onRowClick={(row) => setSelectedMovement(row)}
      />

      {/* Detail Modal */}
      {selectedMovement && (
        <Modal
          isOpen={!!selectedMovement}
          onClose={() => setSelectedMovement(null)}
          title={`Audit Ledger Entry: ${selectedMovement.id}`}
          subtitle={`Document Reference: ${selectedMovement.reference} • ${selectedMovement.date}`}
          size="md"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedMovement(null)}
            >
              Close Ledger Entry
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
              <div className="detail-value font-bold" style={{ color: Number(selectedMovement.qty) > 0 ? 'var(--color-success-600)' : (Number(selectedMovement.qty) < 0 ? 'var(--color-danger-600)' : 'var(--color-primary-600)') }}>
                {Number(selectedMovement.qty) > 0 ? `+${selectedMovement.qty}` : selectedMovement.qty} units
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Balance After Move:</div>
              <div className="detail-value font-bold">{selectedMovement.balanceAfter} units</div>
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
              <div className="detail-label">Documented Reason / Audit Note:</div>
              <div className="detail-value">{selectedMovement.reason || 'Standard system transaction.'}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
