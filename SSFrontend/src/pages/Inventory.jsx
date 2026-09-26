import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  ArrowLeftRight,
  Plus,
  Send,
  SlidersHorizontal,
  FileText,
  Clock,
  Check,
  X
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { INITIAL_WAREHOUSES } from '../data/mockData';
import { hasPermission, normalizeRole, ROLES } from '../utils/permissions';
import { operationApi, warehouseApi } from '../services/api';

export default function Inventory({ products, setProducts, onNotify, activeWarehouse, onChangeWarehouse, warehouses = INITIAL_WAREHOUSES, currentUser }) {
  const facilityList = (warehouses && warehouses.length > 0) ? warehouses : INITIAL_WAREHOUSES;
  const currentRole = normalizeRole(currentUser?.role);
  const isStaff = currentRole === ROLES.STAFF;
  const canValidateAdjustments = hasPermission.canValidateAdjustments(currentUser?.role);
  const [selectedWarehouse, setSelectedWarehouse] = useState(activeWarehouse || 'All');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'transfers' | 'adjustments'

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Transfers and Adjustments log states
  const [transfersList, setTransfersList] = useState([]);
  const [adjustmentsList, setAdjustmentsList] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);

  // Sync facility view whenever activeWarehouse changes in Topbar
  useEffect(() => {
    if (activeWarehouse) {
      setSelectedWarehouse(activeWarehouse);
    }
  }, [activeWarehouse]);

  // Adjustment form state
  const [adjustData, setAdjustData] = useState({
    productId: products[0]?.id || '',
    warehouse: 'Main Central Hub',
    mode: 'exact', // 'exact' | 'add' | 'subtract'
    countedQty: 10,
    quantity: 5,
    reason: 'Routine Cycle Count Discrepancy',
    notes: '',
    reference: `ADJ-${Date.now().toString().slice(-4)}`
  });

  const location = useLocation();

  // Quick Action auto-launch trigger
  useEffect(() => {
    if (location.state?.openModal === 'adjustment') {
      setAdjustData({
        productId: products[0]?.id || '',
        warehouse: activeWarehouse !== 'All' ? activeWarehouse : 'Main Central Hub',
        mode: 'exact',
        countedQty: products[0]?.availableQty ?? 10,
        quantity: 5,
        reason: 'Routine Cycle Count Discrepancy',
        notes: '',
        reference: `ADJ-${Date.now().toString().slice(-4)}`
      });
      setIsAdjustModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, products, activeWarehouse]);

  // Transfer form state
  const [transferData, setTransferData] = useState({
    productId: products[0]?.id || '',
    sourceWarehouse: 'Main Central Hub',
    destWarehouse: 'North Regional Depot',
    quantity: 5,
    trackingCode: `TRF-${Date.now().toString().slice(-4)}`,
    notes: ''
  });

  // Load Transfers & Adjustments
  const loadOperationsData = useCallback(async () => {
    setLoadingOps(true);
    try {
      const [trfRes, adjRes] = await Promise.allSettled([
        operationApi.getTransfers(),
        operationApi.getAdjustments()
      ]);

      if (trfRes.status === 'fulfilled' && trfRes.value?.data?.transfers) {
        setTransfersList(trfRes.value.data.transfers);
      }
      if (adjRes.status === 'fulfilled' && adjRes.value?.data?.adjustments) {
        setAdjustmentsList(adjRes.value.data.adjustments);
      }
    } catch (e) {
      console.warn('Could not load operations logs:', e);
    } finally {
      setLoadingOps(false);
    }
  }, []);

  useEffect(() => {
    loadOperationsData();
  }, [loadOperationsData]);

  // Selected product helper for adjustment calculation
  const targetAdjustProduct = products.find(p => p.id === adjustData.productId) || products[0];
  const currentTheoreticalStock = targetAdjustProduct ? (targetAdjustProduct.availableQty ?? targetAdjustProduct.available_qty ?? 0) : 0;

  // Compute live delta for Stock Adjustment
  const computeAdjustmentDelta = () => {
    if (adjustData.mode === 'exact') {
      return Number(adjustData.countedQty || 0) - currentTheoreticalStock;
    } else if (adjustData.mode === 'add') {
      return Number(adjustData.quantity || 0);
    } else if (adjustData.mode === 'subtract') {
      return -Number(adjustData.quantity || 0);
    }
    return 0;
  };

  const calculatedDelta = computeAdjustmentDelta();
  const calculatedFinalStock = Math.max(0, currentTheoreticalStock + calculatedDelta);

  // Filter products by selected warehouse
  const displayedProducts = products.filter(p => {
    if (selectedWarehouse === 'All') return true;
    return (p.warehouse || '').toLowerCase().includes(selectedWarehouse.toLowerCase());
  });

  // Calculate high-level stock statistics
  const totalStockOnHand = displayedProducts.reduce((sum, p) => sum + (p.availableQty || 0) + (p.reservedQty || 0), 0);
  const totalAvailable = displayedProducts.reduce((sum, p) => sum + (p.availableQty || 0), 0);
  const totalReserved = displayedProducts.reduce((sum, p) => sum + (p.reservedQty || 0), 0);
  const lowStockCount = displayedProducts.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

  // Handle guided adjustment submission (Module 7: Operation 4)
  const handlePerformAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustData.productId) {
      onNotify('Validation Error', 'Please select a target product for adjustment.', 'error');
      return;
    }
    if (!adjustData.reason) {
      onNotify('Validation Error', 'A mandatory reason must be provided for audit tracking.', 'error');
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = {
        productId: adjustData.productId,
        warehouse: adjustData.warehouse,
        mode: adjustData.mode,
        countedQty: Number(adjustData.countedQty || 0),
        quantity: Number(adjustData.quantity || 0),
        reason: adjustData.reason,
        notes: adjustData.notes,
        reference: adjustData.reference || `ADJ-${Date.now().toString().slice(-4)}`
      };

      const res = await operationApi.createAdjustment(payload);

      // Local optimistic product state update
      const updated = products.map(p => {
        if (p.id === adjustData.productId) {
          const newQty = calculatedFinalStock;
          let newStatus = 'In Stock';
          if (newQty === 0) newStatus = 'Out of Stock';
          else if (newQty <= (p.reorderLevel || p.min_stock_level || 10)) newStatus = 'Low Stock';
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
        'Stock Adjusted & Ledger Updated',
        `Discrepancy reconciled: ${targetAdjustProduct?.name || 'Product'} new count is ${calculatedFinalStock} (Delta: ${calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}).`,
        'success'
      );
      loadOperationsData();
    } catch (err) {
      onNotify('Adjustment Error', err.message || 'Failed to submit adjustment', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Inter-warehouse stock transfer (Module 6: Operation 3)
  const handlePerformTransfer = async (e) => {
    e.preventDefault();
    if (transferData.sourceWarehouse === transferData.destWarehouse) {
      onNotify('Validation Error', 'Source and destination facilities cannot be identical.', 'error');
      return;
    }
    const targetProduct = products.find(p => p.id === transferData.productId);
    if (!targetProduct) {
      onNotify('Validation Error', 'Please select a product for transfer.', 'error');
      return;
    }
    const transferQty = parseInt(transferData.quantity, 10) || 1;
    if (transferQty > (targetProduct.availableQty || 0)) {
      onNotify('Insufficient Stock', `Cannot transfer ${transferQty} units. Only ${targetProduct.availableQty} available at origin.`, 'error');
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = {
        productId: transferData.productId,
        sourceLocationId: null,
        destLocationId: null,
        referenceNote: `Transfer from ${transferData.sourceWarehouse} to ${transferData.destWarehouse} (Ref: ${transferData.trackingCode})`,
        notes: transferData.notes,
        quantity: transferQty,
        demandedQty: transferQty
      };

      const res = await operationApi.createTransfer(payload);
      const createdTransfer = res?.data?.transfer;

      // Auto-validate transfer in one smooth flow
      if (createdTransfer?.id) {
        await operationApi.validateTransfer(createdTransfer.id);
      }

      setIsTransferModalOpen(false);
      onNotify(
        'Stock Transfer Validated',
        `Dispatched & logged transfer of ${transferQty} units of ${targetProduct.name} from ${transferData.sourceWarehouse} to ${transferData.destWarehouse}.`,
        'success'
      );
      loadOperationsData();
    } catch (err) {
      onNotify('Transfer Error', err.message || 'Failed to execute transfer', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 1-Click Validate Transfer from table
  const handleValidateTransferRow = async (transfer) => {
    setSubmittingAction(true);
    try {
      await operationApi.validateTransfer(transfer.id || transfer.operationNumber);
      onNotify('Transfer Validated', `Transfer ${transfer.operationNumber || transfer.id} marked DONE. Inventory moved in stock ledger.`, 'success');
      loadOperationsData();
    } catch (err) {
      onNotify('Validation Error', err.message || 'Failed to validate transfer', 'error');
    } finally {
      setSubmittingAction(false);
    }
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
                mode: isStaff ? 'exact' : 'add',
                quantity: isStaff ? row.availableQty : 10,
                reason: isStaff ? 'Physical Cycle Count Verification' : 'Routine Cycle Count Adjustment',
                notes: '',
                reference: `ADJ-${Date.now().toString().slice(-4)}`
              });
              setIsAdjustModalOpen(true);
            }}
            title={isStaff ? 'Enter Physical Count' : 'Adjust Stock'}
          >
            {isStaff ? 'Count' : 'Adjust'}
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
                mode: isStaff ? 'exact' : 'add',
                quantity: 10,
                reason: isStaff ? 'Physical Cycle Count Verification' : 'Routine Cycle Count Adjustment',
                notes: '',
                reference: `ADJ-${Date.now().toString().slice(-4)}`
              });
              setIsAdjustModalOpen(true);
            }}
          >
            <RefreshCw size={16} />
            <span>{isStaff ? 'Physical Count Entry' : 'Guided Stock Adjustment'}</span>
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

      {/* View Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-neutral-200)', paddingBottom: '8px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('inventory')}
        >
          <Boxes size={15} />
          <span>On-Hand Inventory ({displayedProducts.length})</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'transfers' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('transfers')}
        >
          <ArrowLeftRight size={15} />
          <span>Internal Transfers ({transfersList.length})</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'adjustments' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('adjustments')}
        >
          <SlidersHorizontal size={15} />
          <span>Stock Adjustments Audit ({adjustmentsList.length})</span>
        </button>
      </div>

      {/* Tab 1: On-Hand Inventory Table */}
      {activeTab === 'inventory' && (
        <>
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
                    onClick={() => {
                      setSelectedWarehouse('All');
                      onChangeWarehouse?.('All');
                    }}
                  >
                    All Facilities
                  </button>
                  {facilityList.map(wh => (
                    <button
                      key={wh.id}
                      type="button"
                      className={`filter-btn ${selectedWarehouse === wh.name ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedWarehouse(wh.name);
                        onChangeWarehouse?.(wh.name);
                      }}
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

          <DataTable
            columns={columns}
            data={displayedProducts}
            searchPlaceholder="Filter items by product name, SKU, or category..."
          />
        </>
      )}

      {/* Tab 2: Internal Transfers Table */}
      {activeTab === 'transfers' && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Internal Stock Transfers (Module 6: Operation 3)</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', margin: '2px 0 0 0' }}>
                Relocate stock between racks or fulfillment hubs without affecting total company inventory.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsTransferModalOpen(true)}
            >
              <Plus size={14} />
              <span>New Transfer</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-neutral-200)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Transfer Ref</th>
                  <th style={{ padding: '10px 12px' }}>Origin (Source)</th>
                  <th style={{ padding: '10px 12px' }}>Destination</th>
                  <th style={{ padding: '10px 12px' }}>Demanded Units</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
                      No internal transfer operations logged yet. Click "+ New Transfer" to initiate one.
                    </td>
                  </tr>
                ) : (
                  transfersList.map((trf, idx) => (
                    <tr key={trf.id || idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {trf.operationNumber || trf.operation_number || trf.id}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {trf.sourceLocationName || trf.sourceWarehouse || 'Main Hub Origin'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {trf.destLocationName || trf.destWarehouse || 'Regional Depot'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {trf.totalDemanded || trf.quantity || 1} units
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge status={trf.status || 'READY'} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--color-neutral-400)' }}>
                        {trf.createdAt ? new Date(trf.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {trf.status !== 'DONE' && trf.status !== 'CANCELED' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleValidateTransferRow(trf)}
                            disabled={submittingAction}
                            title="Validate transfer and update destination rack"
                          >
                            <Check size={12} />
                            <span>Validate Transfer</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Adjustments Log Table */}
      {activeTab === 'adjustments' && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Stock Adjustments & Physical Counts (Module 7: Operation 4)</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', margin: '2px 0 0 0' }}>
                Permanent audit trail of cycle count reconciliations, damaged scrap write-offs, and surplus entries.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAdjustModalOpen(true)}
            >
              <Plus size={14} />
              <span>Record Adjustment</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-neutral-200)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Audit Ref</th>
                  <th style={{ padding: '10px 12px' }}>Product</th>
                  <th style={{ padding: '10px 12px' }}>Delta / Net Impact</th>
                  <th style={{ padding: '10px 12px' }}>Mandatory Audit Reason</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
                      No adjustment entries recorded yet. Click "Record Adjustment" to reconcile stock.
                    </td>
                  </tr>
                ) : (
                  adjustmentsList.map((adj, idx) => {
                    const deltaVal = adj.delta !== undefined ? adj.delta : 0;
                    return (
                      <tr key={adj.id || idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {adj.operationNumber || adj.operation_number || adj.id}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{adj.productName || 'Product Item'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{adj.sku || ''}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: deltaVal > 0 ? 'var(--color-success-50)' : (deltaVal < 0 ? 'var(--color-danger-50)' : 'var(--color-neutral-100)'),
                            color: deltaVal > 0 ? 'var(--color-success-700)' : (deltaVal < 0 ? 'var(--color-danger-700)' : 'var(--color-neutral-700)')
                          }}>
                            {deltaVal > 0 ? `+${deltaVal}` : deltaVal} units
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {adj.reason || adj.notes || 'Cycle Count Discrepancy'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <StatusBadge status="DONE" />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--color-neutral-400)' }}>
                          {adj.createdAt ? new Date(adj.createdAt).toLocaleString() : 'Just now'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guided Stock Adjustment Flow Modal with Live Delta Reconciliation */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={isStaff ? 'Physical Stock Count Entry' : 'Guided Stock Adjustment Workflow'}
        subtitle="Reconcile physical inventory counts and log adjustments to Stock Ledger"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Computed Delta:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: calculatedDelta > 0 ? 'var(--color-success-100)' : (calculatedDelta < 0 ? 'var(--color-danger-100)' : 'var(--color-neutral-200)'),
                color: calculatedDelta > 0 ? 'var(--color-success-800)' : (calculatedDelta < 0 ? 'var(--color-danger-800)' : 'var(--color-neutral-800)')
              }}>
                {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta} units
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAdjustModalOpen(false)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePerformAdjustment}
                disabled={submittingAction}
              >
                <CheckCircle2 size={15} />
                <span>Confirm & Post to Ledger</span>
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handlePerformAdjustment}>
          {/* Live Reconciliation Preview Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '8px',
            background: 'var(--color-neutral-50)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Recorded (Theoretical)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>{currentTheoreticalStock} units</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Counted (Physical)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                {adjustData.mode === 'exact' ? adjustData.countedQty : (adjustData.mode === 'add' ? currentTheoreticalStock + Number(adjustData.quantity || 0) : currentTheoreticalStock - Number(adjustData.quantity || 0))} units
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Delta ($\Delta$)</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 800,
                color: calculatedDelta > 0 ? 'var(--color-success-600)' : (calculatedDelta < 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-700)')
              }}>
                {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>New On-Hand</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>{calculatedFinalStock} units</div>
            </div>
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
                  {p.name} ({p.sku}) — Available: {p.availableQty ?? p.available_qty} {p.unit || 'pcs'}
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
                {facilityList.map(wh => (
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
                <option value="exact">Exact Physical Count (Reconcile to exact shelf count)</option>
                <option value="subtract">Damaged / Scrap (- Deduct Units)</option>
                <option value="add">Found Surplus (+ Add Units)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            {adjustData.mode === 'exact' ? (
              <div className="form-group">
                <label className="form-label">Physical Counted Quantity <span className="required">*</span></label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={adjustData.countedQty}
                  onChange={(e) => setAdjustData({ ...adjustData, countedQty: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Delta Units to Adjust <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mandatory Audit Reason <span className="required">*</span></label>
              <select
                className="form-select"
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
              >
                <option value="Routine Cycle Count Discrepancy">Routine Cycle Count Discrepancy</option>
                <option value="Damaged in Transit or Warehouse Handling">Damaged in Transit / Warehouse Handling</option>
                <option value="QA Inspection Failure / Scrap">QA Inspection Failure / Scrap</option>
                <option value="Customer Return Restock">Customer RMA Return Restock</option>
                <option value="Found Unaccounted Excess Inventory">Found Unaccounted Excess Inventory</option>
                <option value="Supplier Quarantine Hold">Supplier Quarantine Hold</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Audit Notes & Observations</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Broken packaging on Rack B-04 during forklift move..."
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
        title="Inter-Warehouse Stock Transfer Order (Module 6: Operation 3)"
        subtitle="Relocate inventory between fulfillment facilities"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTransferModalOpen(false)}
              disabled={submittingAction}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePerformTransfer}
              disabled={submittingAction}
            >
              <Send size={15} />
              <span>Dispatch & Validate Transfer</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handlePerformTransfer}>
          <div className="form-group">
            <label className="form-label">Product to Relocate <span className="required">*</span></label>
            <select
              className="form-select"
              value={transferData.productId}
              onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.availableQty ?? p.available_qty} {p.unit || 'pcs'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Facility (Source) <span className="required">*</span></label>
              <select
                className="form-select"
                value={transferData.sourceWarehouse}
                onChange={(e) => setTransferData({ ...transferData, sourceWarehouse: e.target.value })}
                required
              >
                {facilityList.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Facility <span className="required">*</span></label>
              <select
                className="form-select"
                value={transferData.destWarehouse}
                onChange={(e) => setTransferData({ ...transferData, destWarehouse: e.target.value })}
                required
              >
                {facilityList.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Units <span className="required">*</span></label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Carrier & Internal Tracking Manifest</label>
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

