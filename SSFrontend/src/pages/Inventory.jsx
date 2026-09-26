import React, { useState } from 'react';
import {
  Boxes,
  Package,
  RefreshCw,
  Truck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Warehouse,
  History,
  Info,
  Search,
  Filter,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { INITIAL_WAREHOUSES } from '../data/mockData';

export default function Inventory({ products, setProducts, onNotify, activeWarehouse }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(activeWarehouse || 'All');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Adjustment form state
  const [adjustData, setAdjustData] = useState({
    productId: '',
    warehouse: 'West Coast Hub',
    mode: 'add', // 'add' | 'subtract' | 'exact'
    quantity: 5,
    reason: 'Routine Cycle Count Adjustment',
    notes: '',
    reference: `ADJ-${Date.now().toString().slice(-4)}`
  });

  // Transfer form state
  const [transferData, setTransferData] = useState({
    productId: '',
    sourceWarehouse: 'West Coast Hub',
    destWarehouse: 'Central Logistics Hub',
    quantity: 10,
    trackingCode: `TRF-${Date.now().toString().slice(-4)}`,
    notes: ''
  });

  // Filter products by selected warehouse
  const displayedProducts = products.filter(p => {
    if (selectedWarehouse === 'All') return true;
    return p.warehouse.toLowerCase().includes(selectedWarehouse.toLowerCase());
  });

  // Calculate high-level stock statistics
  const totalStockOnHand = displayedProducts.reduce((sum, p) => sum + p.availableQty + p.reservedQty, 0);
  const totalAvailable = displayedProducts.reduce((sum, p) => sum + p.availableQty, 0);
  const totalReserved = displayedProducts.reduce((sum, p) => sum + p.reservedQty, 0);
  const lowStockCount = displayedProducts.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

  // Handle guided adjustment submission
  const handlePerformAdjustment = (e) => {
    e.preventDefault();
    if (!adjustData.productId) {
      alert('Please select a product to adjust.');
      return;
    }
    if (!adjustData.reason) {
      alert('A mandatory reason must be provided for audit tracking.');
      return;
    }

    const targetProduct = products.find(p => p.id === adjustData.productId);
    if (!targetProduct) return;

    let newQty = targetProduct.availableQty;
    const delta = parseInt(adjustData.quantity, 10) || 0;

    if (adjustData.mode === 'add') {
      newQty += delta;
    } else if (adjustData.mode === 'subtract') {
      newQty = Math.max(0, newQty - delta);
    } else if (adjustData.mode === 'exact') {
      newQty = delta;
    }

    let newStatus = 'In Stock';
    if (newQty === 0) newStatus = 'Out of Stock';
    else if (newQty <= targetProduct.reorderLevel) newStatus = 'Low Stock';

    const updated = products.map(p => {
      if (p.id === adjustData.productId) {
        return {
          ...p,
          availableQty: newQty,
          status: newStatus
        };
      }
      return p;
    });

    setProducts(updated);
    setIsAdjustModalOpen(false);
    onNotify(
      'Stock Adjusted',
      `Audit entry ${adjustData.reference}: ${targetProduct.name} available qty updated to ${newQty}.`,
      'success'
    );
  };

  // Handle Inter-warehouse stock transfer
  const handlePerformTransfer = (e) => {
    e.preventDefault();
    if (transferData.sourceWarehouse === transferData.destWarehouse) {
      alert('Source and destination warehouses cannot be identical.');
      return;
    }
    const targetProduct = products.find(p => p.id === transferData.productId);
    if (!targetProduct) {
      alert('Please select a product for transfer.');
      return;
    }
    if (transferData.quantity > targetProduct.availableQty) {
      alert(`Cannot transfer ${transferData.quantity} units. Only ${targetProduct.availableQty} units available.`);
      return;
    }

    // Update product stock
    const updated = products.map(p => {
      if (p.id === transferData.productId) {
        const remaining = p.availableQty - parseInt(transferData.quantity, 10);
        return {
          ...p,
          availableQty: remaining,
          status: remaining === 0 ? 'Out of Stock' : (remaining <= p.reorderLevel ? 'Low Stock' : 'In Stock')
        };
      }
      return p;
    });

    setProducts(updated);
    setIsTransferModalOpen(false);
    onNotify(
      'Stock Transfer In Transit',
      `Dispatched ${transferData.quantity} units of ${targetProduct.name} from ${transferData.sourceWarehouse} to ${transferData.destWarehouse}.`,
      'info'
    );
  };

  // Table columns
  const columns = [
    {
      header: 'Product Details',
      accessor: 'name',
      render: (row) => (
        <div className="table-product-cell">
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-neutral-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-600)',
            flexShrink: 0
          }}>
            <Package size={17} />
          </div>
          <div>
            <div className="table-product-name">{row.name}</div>
            <div className="table-product-sku">SKU: {row.sku} • {row.category}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Hub',
      accessor: 'warehouse',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)' }}>
          <Warehouse size={14} style={{ color: 'var(--color-primary-600)' }} />
          <span>{row.warehouse}</span>
        </div>
      )
    },
    {
      header: 'On Hand (Total)',
      accessor: 'id',
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
          {row.availableQty + row.reservedQty} {row.unit}
        </span>
      )
    },
    {
      header: 'Available',
      accessor: 'availableQty',
      render: (row) => (
        <span style={{
          fontWeight: 700,
          color: row.availableQty === 0 ? 'var(--color-danger-600)' : (row.availableQty <= row.reorderLevel ? 'var(--color-warning-600)' : 'var(--color-success-600)')
        }}>
          {row.availableQty} {row.unit}
        </span>
      )
    },
    {
      header: 'Reserved',
      accessor: 'reservedQty',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--font-size-sm)' }}>
          {row.reservedQty} {row.unit}
        </span>
      )
    },
    {
      header: 'Min Threshold',
      accessor: 'reorderLevel',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--font-size-sm)' }}>
          {row.reorderLevel} {row.unit}
        </span>
      )
    },
    {
      header: 'Stock Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'sku',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => {
              setAdjustData({
                productId: row.id,
                warehouse: row.warehouse,
                mode: 'add',
                quantity: 10,
                reason: 'Routine Cycle Count Adjustment',
                notes: '',
                reference: `ADJ-${Date.now().toString().slice(-4)}`
              });
              setIsAdjustModalOpen(true);
            }}
            title="Adjust Stock"
          >
            Adjust
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setTransferData({
                productId: row.id,
                sourceWarehouse: row.warehouse,
                destWarehouse: 'Central Logistics Hub',
                quantity: Math.min(5, row.availableQty),
                trackingCode: `TRF-${Date.now().toString().slice(-4)}`,
                notes: ''
              });
              setIsTransferModalOpen(true);
            }}
            title="Transfer between warehouses"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="inventory-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Operations</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Real-Time Inventory</span>
          </div>
          <h1 className="page-title">Multi-Warehouse Stock Telemetry</h1>
          <p className="page-subtitle">
            Monitor physical on-hand, allocated orders, reorder thresholds, and initiate guided adjustments.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setTransferData({
                productId: products[0]?.id || '',
                sourceWarehouse: 'West Coast Hub',
                destWarehouse: 'Central Logistics Hub',
                quantity: 5,
                trackingCode: `TRF-${Date.now().toString().slice(-4)}`,
                notes: ''
              });
              setIsTransferModalOpen(true);
            }}
          >
            <ArrowLeftRight size={16} />
            <span>Inter-Hub Transfer</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setAdjustData({
                productId: products[0]?.id || '',
                warehouse: 'West Coast Hub',
                mode: 'add',
                quantity: 10,
                reason: 'Routine Cycle Count Adjustment',
                notes: '',
                reference: `ADJ-${Date.now().toString().slice(-4)}`
              });
              setIsAdjustModalOpen(true);
            }}
          >
            <RefreshCw size={16} />
            <span>Guided Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-header">
            <div className="kpi-icon primary"><Boxes size={22} /></div>
          </div>
          <div>
            <div className="kpi-value">{totalStockOnHand.toLocaleString()}</div>
            <div className="kpi-label">Total On-Hand Units</div>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <div className="kpi-icon success"><CheckCircle2 size={22} /></div>
          </div>
          <div>
            <div className="kpi-value">{totalAvailable.toLocaleString()}</div>
            <div className="kpi-label">Free Available for Sale</div>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <div className="kpi-icon warning"><Truck size={22} /></div>
          </div>
          <div>
            <div className="kpi-value">{totalReserved.toLocaleString()}</div>
            <div className="kpi-label">Reserved for Sales Orders</div>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-header">
            <div className="kpi-icon danger"><AlertTriangle size={22} /></div>
          </div>
          <div>
            <div className="kpi-value">{lowStockCount} SKUs</div>
            <div className="kpi-label">Critical or Low Stock</div>
          </div>
        </div>
      </div>

      {/* Warehouse Filter Bar */}
      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={16} style={{ color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Filter by Facility:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`filter-btn ${selectedWarehouse === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedWarehouse('All')}
              >
                All Facilities
              </button>
              {INITIAL_WAREHOUSES.map(wh => (
                <button
                  key={wh.id}
                  type="button"
                  className={`filter-btn ${selectedWarehouse === wh.name ? 'active' : ''}`}
                  onClick={() => setSelectedWarehouse(wh.name)}
                >
                  {wh.name}
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
            Showing {displayedProducts.length} line items
          </span>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={displayedProducts}
        searchPlaceholder="Filter items by product name, SKU, or category..."
      />

      {/* Guided Stock Adjustment Flow Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Guided Stock Adjustment Workflow"
        subtitle="Mandatory audit trail reason code and confirmation required"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              Audit logged by Alexandria Vance (Admin)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAdjustModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePerformAdjustment}
              >
                Confirm & Record Audit Entry
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handlePerformAdjustment}>
          <div className="alert alert-warning" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', gap: '8px' }}>
            <Info size={16} className="shrink-0" style={{ color: 'var(--color-warning-600)' }} />
            <span>
              Stock adjustments immediately update financial ledgers and reorder alerts. Ensure physical count count sheets match.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Target Product <span className="required">*</span></label>
            <select
              className="form-select"
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.availableQty} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Storage Facility</label>
              <select
                className="form-select"
                value={adjustData.warehouse}
                onChange={(e) => setAdjustData({ ...adjustData, warehouse: e.target.value })}
              >
                {INITIAL_WAREHOUSES.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Mode</label>
              <select
                className="form-select"
                value={adjustData.mode}
                onChange={(e) => setAdjustData({ ...adjustData, mode: e.target.value })}
              >
                <option value="add">Inbound Increase (+ Add Units)</option>
                <option value="subtract">Outbound Scrap / Loss (- Deduct Units)</option>
                <option value="exact">Set Exact Count (Override to specific Qty)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Audit Reason <span className="required">*</span></label>
              <select
                className="form-select"
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
              >
                <option value="Routine Cycle Count Adjustment">Routine Cycle Count Discrepancy</option>
                <option value="Damaged Goods / Scrap">Damaged in Transit or Warehouse Handling</option>
                <option value="Quality Assurance Failure">QA Inspection Failure / Calibration Loss</option>
                <option value="Customer RMA Return to Restock">Customer RMA Return</option>
                <option value="Found Unaccounted Stock">Found Unaccounted Excess Inventory</option>
                <option value="Supplier Quarantine">Supplier Quarantine / Recall Hold</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Audit Notes & Documentation</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Inspector initials, physical rack location, lot code or incident report number..."
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Guided Inter-Warehouse Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Inter-Warehouse Stock Transfer Order"
        subtitle="Rebalance inventory between fulfillment centers"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTransferModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePerformTransfer}
            >
              Dispatch Transfer
            </button>
          </div>
        }
      >
        <form onSubmit={handlePerformTransfer}>
          <div className="form-group">
            <label className="form-label">Product to Relocate</label>
            <select
              className="form-select"
              value={transferData.productId}
              onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.availableQty}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Facility (Source)</label>
              <select
                className="form-select"
                value={transferData.sourceWarehouse}
                onChange={(e) => setTransferData({ ...transferData, sourceWarehouse: e.target.value })}
              >
                {INITIAL_WAREHOUSES.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Facility</label>
              <select
                className="form-select"
                value={transferData.destWarehouse}
                onChange={(e) => setTransferData({ ...transferData, destWarehouse: e.target.value })}
              >
                {INITIAL_WAREHOUSES.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Units</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Carrier & Tracking Manifest</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Internal Freight Truck #41 / Carrier Ref"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
