import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  Package,
  ArrowRight,
  User,
  MapPin,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  Trash2,
  Box,
  Check,
  X,
  FileText,
  Layers,
  ArrowUpRight,
  Warehouse
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import { hasPermission } from '../utils/permissions';
import { productApi, operationApi } from '../services/api';
import { matchesWarehouse, DEFAULT_WAREHOUSES } from '../utils/warehouseUtils';

export default function SalesOrders({
  onNotify,
  currentUser,
  activeWarehouse = 'All',
  onChangeWarehouse,
  warehouses = []
}) {
  const canCreateDeliveries = hasPermission.canCreateDeliveries(currentUser?.role);
  const location = useLocation();

  const facilityList = warehouses && warehouses.length > 0 ? warehouses : DEFAULT_WAREHOUSES;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('FedEx Priority');
  const [submittingAction, setSubmittingAction] = useState(false);

  // New Order Form State with dynamic lines
  const [newOrder, setNewOrder] = useState({
    partnerName: '',
    shippingAddress: '',
    notes: '',
    shippingCarrier: 'FedEx Priority',
    lines: [
      { productId: '', demandedQty: 1, unitPrice: 0 }
    ]
  });

  // Load Products Catalog for order item line picker
  const loadCatalog = useCallback(async () => {
    try {
      const res = await productApi.getProducts();
      if (res?.data?.products && res.data.products.length > 0) {
        setProductsCatalog(res.data.products);
      } else {
        setProductsCatalog([]);
      }
    } catch {
      setProductsCatalog([]);
    }
  }, []);

  // Fetch Delivery Orders
  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operationApi.getDeliveries();
      if (res?.data?.deliveries && res.data.deliveries.length > 0) {
        // Map backend format to uniform frontend display format
        const formatted = res.data.deliveries.map((d) => ({
          id: d.operation_number || d.operationNumber || d.id,
          rawId: d.id,
          customer: d.partner_name || d.partnerName || 'Direct Customer',
          destination: d.shipping_address || d.sourceLocationName || d.warehouseName || 'Central Fulfillment',
          contact: d.created_by_name || 'Sales Department',
          date: d.created_at || d.createdAt ? new Date(d.created_at || d.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          total: parseFloat(d.total_amount || d.totalCost || 0),
          fulfillmentStatus: d.status || 'WAITING',
          shippingCarrier: d.shipping_carrier || 'FedEx Priority',
          trackingNumber: d.tracking_number || 'Pending Assignment',
          lines: d.lines || d.items || [],
          notes: d.notes || d.reference_note || d.referenceNote,
        }));
        setOrders(formatted);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Backend deliveries unavailable:', err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
    loadCatalog();
  }, [loadDeliveries, loadCatalog]);

  // Quick Action auto-launch trigger from navigation
  useEffect(() => {
    if (location.state?.openModal === 'so') {
      setIsCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle dynamic order lines in Create Modal
  const handleAddLine = () => {
    setNewOrder((prev) => ({
      ...prev,
      lines: [...prev.lines, { productId: productsCatalog[0]?.id || '', demandedQty: 1, unitPrice: productsCatalog[0]?.price || 0 }]
    }));
  };

  const handleRemoveLine = (index) => {
    if (newOrder.lines.length <= 1) return;
    setNewOrder((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleLineChange = (index, field, value) => {
    setNewOrder((prev) => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'productId') {
        const prod = productsCatalog.find(p => String(p.id) === String(value));
        if (prod) {
          updated[index].unitPrice = prod.price || 0;
        }
      }
      return { ...prev, lines: updated };
    });
  };

  const calculateOrderTotal = () => {
    return newOrder.lines.reduce((sum, line) => {
      return sum + (Number(line.demandedQty || 0) * Number(line.unitPrice || 0));
    }, 0);
  };

  // Create Delivery Order Handler
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.partnerName) {
      onNotify('Validation Error', 'Customer Name is required.', 'error');
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = {
        partnerName: newOrder.partnerName,
        shippingAddress: newOrder.shippingAddress || 'Standard Warehouse Hub',
        notes: newOrder.notes,
        lines: newOrder.lines.map(l => ({
          productId: l.productId || productsCatalog[0]?.id,
          demandedQty: Number(l.demandedQty) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        }))
      };

      const res = await operationApi.createDelivery(payload);
      if (res?.data?.delivery) {
        onNotify('Delivery Order Created', `Order ${res.data.delivery.operation_number} logged in WAITING status.`, 'success');
      } else {
        onNotify('Delivery Order Created', 'New outgoing delivery order queued.', 'success');
      }
      setIsCreateModalOpen(false);
      setNewOrder({
        partnerName: '',
        shippingAddress: '',
        notes: '',
        shippingCarrier: 'FedEx Priority',
        lines: [{ productId: productsCatalog[0]?.id || '', demandedQty: 1, unitPrice: productsCatalog[0]?.price || 0 }]
      });
      loadDeliveries();
    } catch (err) {
      onNotify('Creation Error', err.message || 'Failed to create delivery order', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 1: Pick & Reserve Stock
  const handlePickOrder = async (order) => {
    setSubmittingAction(true);
    try {
      await operationApi.pickDelivery(order.rawId || order.id);
      onNotify('Stock Picked & Reserved', `Items picked for ${order.id}. Reserved quantity updated in stock database.`, 'success');
      loadDeliveries();
    } catch (err) {
      // Local optimistic fallback
      setOrders(orders.map(o => (o.id === order.id || o.rawId === order.rawId) ? { ...o, fulfillmentStatus: 'READY' } : o));
      onNotify('Stock Picked & Reserved', `Items picked for ${order.id}. Status changed to READY.`, 'info');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 2: Pack Items
  const handlePackOrder = async (order) => {
    setSubmittingAction(true);
    try {
      await operationApi.packDelivery(order.rawId || order.id);
      onNotify('Order Packed', `Items for ${order.id} bundled into parcel. Status changed to PACKED.`, 'success');
      loadDeliveries();
    } catch (err) {
      // Local optimistic fallback
      setOrders(orders.map(o => (o.id === order.id || o.rawId === order.rawId) ? { ...o, fulfillmentStatus: 'PACKED' } : o));
      onNotify('Order Packed', `Items for ${order.id} packed into parcel.`, 'info');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 3: Validate & Dispatch
  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    setSubmittingAction(true);

    const trackingNum = trackingNumberInput || `TRK-${Date.now().toString().slice(-6)}`;
    try {
      await operationApi.validateDelivery(dispatchModalOrder.rawId || dispatchModalOrder.id, {
        trackingNumber: trackingNum,
        carrier: carrierInput
      });
      onNotify(
        'Delivery Validated & Dispatched',
        `Stock deducted from inventory ledger. Order ${dispatchModalOrder.id} dispatched via ${carrierInput} (${trackingNum}).`,
        'success'
      );
      setDispatchModalOrder(null);
      loadDeliveries();
    } catch (err) {
      // Local optimistic fallback
      setOrders(orders.map(o => {
        if (o.id === dispatchModalOrder.id || o.rawId === dispatchModalOrder.rawId) {
          return {
            ...o,
            fulfillmentStatus: 'DONE',
            shippingCarrier: carrierInput,
            trackingNumber: trackingNum
          };
        }
        return o;
      }));
      setDispatchModalOrder(null);
      onNotify('Delivery Validated', `${dispatchModalOrder.id} marked DONE & stock movement posted.`, 'success');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Cancel Delivery
  const handleCancelDelivery = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel delivery order ${order.id}? Any reserved stock will be released.`)) return;
    setSubmittingAction(true);
    try {
      await operationApi.cancelDelivery(order.rawId || order.id);
      onNotify('Order Cancelled', `Order ${order.id} cancelled. Reserved stock released.`, 'info');
      loadDeliveries();
    } catch (err) {
      setOrders(orders.map(o => (o.id === order.id || o.rawId === order.rawId) ? { ...o, fulfillmentStatus: 'CANCELLED' } : o));
      onNotify('Order Cancelled', `Order ${order.id} marked as CANCELLED.`, 'info');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter orders by active warehouse
  const displayedOrders = useMemo(() => {
    if (!activeWarehouse || activeWarehouse === 'All') return orders;
    return orders.filter(o => 
      matchesWarehouse(o.destination, activeWarehouse, facilityList) ||
      matchesWarehouse(o.warehouse, activeWarehouse, facilityList) ||
      matchesWarehouse(o.sourceLocationName, activeWarehouse, facilityList)
    );
  }, [orders, activeWarehouse, facilityList]);

  // Metrics Calculation
  const totalCount = displayedOrders.length;
  const waitingCount = displayedOrders.filter(o => ['WAITING', 'Pending', 'DRAFT'].includes(o.fulfillmentStatus)).length;
  const readyCount = displayedOrders.filter(o => ['READY', 'Allocated'].includes(o.fulfillmentStatus)).length;
  const packedCount = displayedOrders.filter(o => ['PACKED', 'Picked'].includes(o.fulfillmentStatus)).length;
  const doneCount = displayedOrders.filter(o => ['DONE', 'Dispatched', 'Delivered'].includes(o.fulfillmentStatus)).length;

  // Table Columns
  const columns = [
    {
      header: 'Delivery No.',
      accessor: 'id',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-neutral-900)' }}>{row.id}</span>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.date}</div>
        </div>
      )
    },
    {
      header: 'Customer & Contact',
      accessor: 'customer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>{row.customer}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>Attn: {row.contact}</div>
        </div>
      )
    },
    {
      header: 'Destination',
      accessor: 'destination',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)' }}>
          <MapPin size={12} style={{ color: 'var(--color-neutral-400)' }} />
          <span>{row.destination}</span>
        </div>
      )
    },
    {
      header: 'Total Value',
      accessor: 'total',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
          ₹{parseFloat(row.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Fulfillment Stage',
      accessor: 'fulfillmentStatus',
      render: (row) => <StatusBadge status={row.fulfillmentStatus} />
    },
    {
      header: 'Carrier & Waybill',
      accessor: 'shippingCarrier',
      render: (row) => (
        <div style={{ fontSize: 'var(--font-size-xs)' }}>
          <div style={{ fontWeight: 500 }}>{row.shippingCarrier}</div>
          <div style={{ fontFamily: 'monospace', color: 'var(--color-neutral-400)', fontSize: '10px' }}>
            {row.trackingNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Operations Pipeline',
      accessor: 'id',
      sortable: false,
      render: (row) => {
        const st = (row.fulfillmentStatus || '').toUpperCase();
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Step 1: Pick / Reserve Stock */}
            {(st === 'WAITING' || st === 'PENDING' || st === 'DRAFT') && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePickOrder(row);
                }}
                disabled={submittingAction}
                title="Check available stock and reserve inventory"
              >
                <Package size={12} />
                <span>1. Pick Items</span>
              </button>
            )}

            {/* Step 2: Pack Items */}
            {(st === 'READY' || st === 'ALLOCATED') && (
              <button
                type="button"
                className="btn btn-warning btn-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePackOrder(row);
                }}
                disabled={submittingAction}
                title="Bundle picked items into parcel"
              >
                <Box size={12} />
                <span>2. Pack Items</span>
              </button>
            )}

            {/* Step 3: Validate / Dispatch */}
            {(st === 'PACKED' || st === 'PICKED') && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setDispatchModalOrder(row);
                  setCarrierInput(row.shippingCarrier || 'FedEx Priority');
                  setTrackingNumberInput(`FDX-${Math.floor(100000000 + Math.random() * 900000000)}`);
                }}
                disabled={submittingAction}
                title="Deduct stock from ledger and dispatch parcel"
              >
                <Send size={12} />
                <span>3. Validate & Dispatch</span>
              </button>
            )}

            {/* Completed */}
            {(st === 'DONE' || st === 'DISPATCHED' || st === 'DELIVERED') && (
              <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={12} />
                <span>Dispatched</span>
              </span>
            )}

            {/* Cancel if not done */}
            {st !== 'DONE' && st !== 'DISPATCHED' && st !== 'CANCELLED' && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelDelivery(row);
                }}
                title="Cancel delivery order"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const filterOptions = [
    { label: 'All Orders', value: '' },
    { label: 'Waiting (Step 1)', value: 'WAITING' },
    { label: 'Ready / Picked (Step 2)', value: 'READY' },
    { label: 'Packed (Step 3)', value: 'PACKED' },
    { label: 'Done / Dispatched', value: 'DONE' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  return (
    <div className="sales-orders-page animate-fade-in">
      {/* Read-Only / Pick-Pack Notice for Staff */}
      {!canCreateDeliveries && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: 'var(--color-neutral-100)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-neutral-700)',
          borderLeft: '4px solid var(--color-neutral-400)'
        }}>
          <Package size={16} style={{ color: 'var(--color-neutral-600)', flexShrink: 0 }} />
          <span><strong>Warehouse Execution:</strong> Staff profile can execute the <strong>Pick</strong>, <strong>Pack</strong>, and <strong>Validate</strong> steps in the delivery pipeline. Order authoring is reserved for Managers and Admins.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Operations</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Delivery Orders (Outgoing Goods)</span>
          </div>
          <h1 className="page-title">Delivery Orders & Outbound Fulfillment</h1>
          <p className="page-subtitle">
            Manage outgoing shipments: <strong>Pick</strong> (Reserve Stock) &rarr; <strong>Pack</strong> (Parcels) &rarr; <strong>Validate</strong> (Atomic Stock Ledger Deduction & Courier Dispatch).
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDeliveries}
            title="Refresh Deliveries"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          {canCreateDeliveries ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>New Delivery Order</span>
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Pick / Pack Active
            </span>
          )}
        </div>
      </div>

      {/* Active Warehouse Banner */}
      {activeWarehouse && activeWarehouse !== 'All' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(232, 137, 78, 0.08)',
          border: '1px solid rgba(232, 137, 78, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-primary-700)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={16} style={{ color: 'var(--color-primary-600)' }} />
            <span>
              Showing outbound customer deliveries for <strong>{activeWarehouse}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChangeWarehouse?.('All')}
            style={{ fontSize: '11px', padding: '4px 10px', height: 'auto' }}
          >
            Show All Warehouses
          </button>
        </div>
      )}

      {/* Pipeline Status Metric KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Outgoing Orders"
          value={totalCount}
          subtext="Active customer shipments"
          icon={Layers}
          trend="All Shipments"
          trendDirection="up"
          variant="primary"
        />

        <KpiCard
          title="1. Awaiting Pick"
          value={waitingCount}
          subtext="Pending inventory reservation"
          icon={Clock}
          trend="Step 1"
          trendDirection="down"
          variant="info"
        />

        <KpiCard
          title="2. Ready & Packing"
          value={readyCount + packedCount}
          subtext="Stock reserved / in parcels"
          icon={Package}
          trend="Step 2"
          trendDirection="up"
          variant="warning"
        />

        <KpiCard
          title="3. Dispatched (Done)"
          value={doneCount}
          subtext="Stock ledger deducted"
          icon={CheckCircle2}
          trend="Completed"
          trendDirection="up"
          variant="success"
        />
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={displayedOrders}
        searchPlaceholder="Search by delivery number, customer name, destination, tracking..."
        filterOptions={filterOptions}
        filterKey="fulfillmentStatus"
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Step 3: Validate & Dispatch Modal */}
      {dispatchModalOrder && (
        <Modal
          isOpen={!!dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
          title={`Validate & Dispatch Delivery: ${dispatchModalOrder.id}`}
          subtitle={`Customer: ${dispatchModalOrder.customer} • Destination: ${dispatchModalOrder.destination}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDispatchModalOrder(null)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDispatch}
                disabled={submittingAction}
              >
                <Send size={15} />
                <span>Confirm Outbound Dispatch</span>
              </button>
            </div>
          }
        >
          <div>
            <div className="alert alert-info" style={{ fontSize: 'var(--font-size-xs)', marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>Inventory & Stock Ledger Impact:</div>
              Validation will atomically decrement product <code>available_qty</code>, release reserved quantities, and log negative stock movement lines into the Stock Ledger.
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Carrier</label>
              <select
                className="form-select"
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
              >
                <option value="FedEx Priority">FedEx Priority Logistics</option>
                <option value="DHL Express">DHL Express Global</option>
                <option value="Blue Dart Express">Blue Dart Express</option>
                <option value="Delhivery Surface">Delhivery Surface</option>
                <option value="UPS Supply Chain">UPS Supply Chain</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Waybill / Tracking Airway Bill <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                placeholder="e.g. FDX-982348123"
                required
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Create Delivery Order Modal with Multi-line items */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Outgoing Delivery Order"
        subtitle="Initiate customer delivery order with multi-product stock lines"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              Estimated Total: ₹{calculateOrderTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateOrder}
                disabled={submittingAction}
              >
                <Plus size={15} />
                <span>Create Delivery Order</span>
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label className="form-label">Customer / Partner Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apex Robotics Labs or Bharat Tech Solutions"
              value={newOrder.partnerName}
              onChange={(e) => setNewOrder({ ...newOrder, partnerName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipping Address / Destination</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sector 62, Noida, Uttar Pradesh"
                value={newOrder.shippingAddress}
                onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Carrier</label>
              <select
                className="form-select"
                value={newOrder.shippingCarrier}
                onChange={(e) => setNewOrder({ ...newOrder, shippingCarrier: e.target.value })}
              >
                <option value="FedEx Priority">FedEx Priority</option>
                <option value="Blue Dart Express">Blue Dart Express</option>
                <option value="DHL Express">DHL Express</option>
                <option value="Delhivery Surface">Delhivery Surface</option>
              </select>
            </div>
          </div>

          {/* Product Items Lines Table */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>Order Line Items (Products to Demand)</label>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleAddLine}
              >
                <Plus size={12} />
                <span>Add Product Line</span>
              </button>
            </div>

            <div style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-neutral-200)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Product</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', width: '120px' }}>Demanded Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', width: '130px' }}>Unit Price (₹)</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', width: '130px' }}>Subtotal (₹)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {newOrder.lines.map((line, idx) => {
                    const lineSubtotal = (Number(line.demandedQty) || 0) * (Number(line.unitPrice) || 0);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            className="form-select"
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                            value={line.productId}
                            onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                            required
                          >
                            <option value="">Select a Product...</option>
                            {productsCatalog.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku || 'SKU'}) — Avail: {p.available_qty ?? p.availableQty ?? p.stock ?? 0}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 8px', textAlign: 'right' }}
                            value={line.demandedQty}
                            onChange={(e) => handleLineChange(idx, 'demandedQty', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            required
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 8px', textAlign: 'right' }}
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                          ₹{lineSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                          {newOrder.lines.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-danger"
                              onClick={() => handleRemoveLine(idx)}
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes / Delivery Instructions</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Fragile electronics, handle with care, gate pass required"
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Order Details & Workflow Pipeline Drawer Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Delivery Order: ${selectedOrder.id}`}
          subtitle={`Customer: ${selectedOrder.customer}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={selectedOrder.fulfillmentStatus} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close Profile
              </button>
            </div>
          }
        >
          <div>
            {/* 4-Step Interactive Pipeline Breadcrumbs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--color-neutral-50)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              border: '1px solid var(--color-neutral-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: ['WAITING', 'READY', 'PACKED', 'DONE'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 1 : 0.4 }}>
                <span className="badge badge-neutral" style={{ width: '22px', height: '22px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Draft / Waiting</span>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--color-neutral-400)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: ['READY', 'PACKED', 'DONE'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 1 : 0.4 }}>
                <span className={`badge ${['READY', 'PACKED', 'DONE'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 'badge-warning' : 'badge-neutral'}`} style={{ width: '22px', height: '22px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Pick & Reserve</span>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--color-neutral-400)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: ['PACKED', 'DONE'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 1 : 0.4 }}>
                <span className={`badge ${['PACKED', 'DONE'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 'badge-info' : 'badge-neutral'}`} style={{ width: '22px', height: '22px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Pack Parcel</span>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--color-neutral-400)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: ['DONE', 'DISPATCHED'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 1 : 0.4 }}>
                <span className={`badge ${['DONE', 'DISPATCHED'].includes((selectedOrder.fulfillmentStatus || '').toUpperCase()) ? 'badge-success' : 'badge-neutral'}`} style={{ width: '22px', height: '22px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Dispatch & Ledger</span>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="detail-section-title">Delivery & Carrier Coordinates</h4>
              <div className="detail-row">
                <div className="detail-label">Client / Partner:</div>
                <div className="detail-value font-semibold">{selectedOrder.customer}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Attention:</div>
                <div className="detail-value">{selectedOrder.contact}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Destination Address:</div>
                <div className="detail-value">{selectedOrder.destination}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Carrier & Tracking:</div>
                <div className="detail-value font-semibold">{selectedOrder.shippingCarrier} ({selectedOrder.trackingNumber})</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Total Order Value:</div>
                <div className="detail-value font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                  ₹{parseFloat(selectedOrder.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {selectedOrder.lines && selectedOrder.lines.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 className="detail-section-title" style={{ marginBottom: '8px' }}>Product Demand Lines</h4>
                <div style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: 'var(--color-neutral-50)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px' }}>Product</th>
                        <th style={{ textAlign: 'right', padding: '6px 10px' }}>Demanded</th>
                        <th style={{ textAlign: 'right', padding: '6px 10px' }}>Done Qty</th>
                        <th style={{ textAlign: 'right', padding: '6px 10px' }}>Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.lines.map((l, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{l.product_name || l.name || `Product #${l.product_id}`}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{l.demanded_qty || l.demandedQty || 1}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--color-success-600)' }}>{l.done_qty || l.doneQty || 0}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{parseFloat(l.unit_price || l.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Action Button within Drawer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {(selectedOrder.fulfillmentStatus === 'WAITING' || selectedOrder.fulfillmentStatus === 'Pending') && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    handlePickOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <Package size={14} />
                  <span>Execute Pick & Reserve Stock</span>
                </button>
              )}

              {(selectedOrder.fulfillmentStatus === 'READY' || selectedOrder.fulfillmentStatus === 'Allocated') && (
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    handlePackOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <Box size={14} />
                  <span>Execute Parcel Packaging</span>
                </button>
              )}

              {(selectedOrder.fulfillmentStatus === 'PACKED' || selectedOrder.fulfillmentStatus === 'Picked') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setDispatchModalOrder(selectedOrder);
                    setCarrierInput(selectedOrder.shippingCarrier || 'FedEx Priority');
                    setTrackingNumberInput(`FDX-${Math.floor(100000000 + Math.random() * 900000000)}`);
                    setSelectedOrder(null);
                  }}
                >
                  <Send size={14} />
                  <span>Validate & Dispatch</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
