import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { INITIAL_SALES_ORDERS, INITIAL_PRODUCTS } from '../data/mockData';

export default function SalesOrders({ onNotify }) {
  const location = useLocation();
  const [orders, setOrders] = useState(INITIAL_SALES_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Create SO State
  const [newOrder, setNewOrder] = useState({
    customer: '',
    contact: '',
    destination: '',
    expectedDispatch: '2026-09-30',
    total: 4500.00,
    shippingCarrier: 'FedEx Priority',
    itemCount: 2
  });

  // Quick Action auto-launch trigger
  useEffect(() => {
    if (location.state?.openModal === 'so') {
      setNewOrder({
        customer: '',
        contact: '',
        destination: '',
        expectedDispatch: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        total: 2500.00,
        shippingCarrier: 'FedEx Priority',
        itemCount: 2
      });
      setIsCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrder.customer) return;

    const created = {
      id: `SO-88${Math.floor(50 + Math.random() * 50)}`,
      ...newOrder,
      date: new Date().toISOString().slice(0, 10),
      fulfillmentStatus: 'Pending',
      paymentStatus: 'Paid',
      trackingNumber: 'Pending'
    };

    setOrders([created, ...orders]);
    setIsCreateModalOpen(false);
    onNotify('Sales Order Logged', `Order ${created.id} queued for customer ${created.customer}.`, 'success');
  };

  // Progress fulfillment status
  const handleProgressStatus = (order, nextStatus) => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, fulfillmentStatus: nextStatus } : o));
    onNotify('Fulfillment Updated', `${order.id} status progressed to: ${nextStatus}.`, 'info');
  };

  // Dispatch workflow
  const handleConfirmDispatch = () => {
    if (!dispatchModalOrder) return;
    setOrders(orders.map(o => {
      if (o.id === dispatchModalOrder.id) {
        return {
          ...o,
          fulfillmentStatus: 'Dispatched',
          trackingNumber: trackingNumberInput || `TRK-${Date.now().toString().slice(-6)}`
        };
      }
      return o;
    }));
    setDispatchModalOrder(null);
    onNotify('Order Dispatched', `${dispatchModalOrder.id} handed to carrier with tracking number.`, 'success');
  };

  // Table Columns
  const columns = [
    {
      header: 'SO Number',
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
          ₹{parseFloat(row.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Fulfillment Status',
      accessor: 'fulfillmentStatus',
      render: (row) => <StatusBadge status={row.fulfillmentStatus} />
    },
    {
      header: 'Carrier & Tracking',
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
      header: 'Fulfillment Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.fulfillmentStatus === 'Pending' && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressStatus(row, 'Allocated');
              }}
              title="Allocate inventory stock to this order"
            >
              Allocate
            </button>
          )}

          {row.fulfillmentStatus === 'Allocated' && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressStatus(row, 'Picked');
              }}
              title="Confirm warehouse picking & packaging"
            >
              Mark Picked
            </button>
          )}

          {row.fulfillmentStatus === 'Picked' && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={(e) => {
                e.stopPropagation();
                setDispatchModalOrder(row);
                setTrackingNumberInput(`FDX-${Math.floor(100000000 + Math.random() * 900000000)}`);
              }}
              title="Dispatch to courier"
            >
              <Send size={12} />
              <span>Dispatch</span>
            </button>
          )}

          {row.fulfillmentStatus === 'Dispatched' && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressStatus(row, 'Delivered');
              }}
            >
              Mark Delivered
            </button>
          )}
        </div>
      )
    }
  ];

  const filterOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Allocated', value: 'Allocated' },
    { label: 'Picked', value: 'Picked' },
    { label: 'Dispatched', value: 'Dispatched' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  return (
    <div className="sales-orders-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Fulfillment</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Sales Orders</span>
          </div>
          <h1 className="page-title">Sales Orders & Dispatch Execution</h1>
          <p className="page-subtitle">
            Manage customer order allocation, warehouse pick lists, and parcel carrier dispatching.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>New Sales Order</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search by order ID, customer name, destination..."
        filterOptions={filterOptions}
        filterKey="fulfillmentStatus"
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Dispatch Modal Workflow */}
      {dispatchModalOrder && (
        <Modal
          isOpen={!!dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
          title={`Dispatch Order: ${dispatchModalOrder.id}`}
          subtitle={`Customer: ${dispatchModalOrder.customer} • Destination: ${dispatchModalOrder.destination}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDispatchModalOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDispatch}
              >
                <Send size={15} />
                <span>Confirm Outbound Dispatch</span>
              </button>
            </div>
          }
        >
          <div>
            <div className="alert alert-info" style={{ fontSize: 'var(--font-size-xs)' }}>
              Outbound dispatch deducts physical reserved stock and triggers customer tracking email notifications.
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Carrier</label>
              <select className="form-select" defaultValue={dispatchModalOrder.shippingCarrier}>
                <option value="FedEx Freight (Priority)">FedEx Freight (Priority)</option>
                <option value="DHL Global Express">DHL Global Express</option>
                <option value="UPS Supply Chain">UPS Supply Chain</option>
                <option value="DB Schenker">DB Schenker Logistics</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Carrier Waybill / Tracking Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                required
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sales Order"
        subtitle="Generate outbound customer order and trigger inventory allocation"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateOrder}
            >
              Authorize Order
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label className="form-label">Client Company Legal Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apex Robotics Labs"
              value={newOrder.customer}
              onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Elena Rostova"
                value={newOrder.contact}
                onChange={(e) => setNewOrder({ ...newOrder, contact: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shipping Destination</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Austin, TX, USA"
                value={newOrder.destination}
                onChange={(e) => setNewOrder({ ...newOrder, destination: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Order Total (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newOrder.total}
                onChange={(e) => setNewOrder({ ...newOrder, total: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shipping Carrier</label>
              <select
                className="form-select"
                value={newOrder.shippingCarrier}
                onChange={(e) => setNewOrder({ ...newOrder, shippingCarrier: e.target.value })}
              >
                <option value="FedEx Freight (Priority)">FedEx Freight (Priority)</option>
                <option value="DHL Global Express">DHL Global Express</option>
                <option value="UPS Supply Chain">UPS Supply Chain</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Profile: ${selectedOrder.id}`}
          subtitle={`Customer: ${selectedOrder.customer}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={selectedOrder.fulfillmentStatus} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div>
            <div className="detail-section">
              <h4 className="detail-section-title">Delivery Coordinates</h4>
              <div className="detail-row">
                <div className="detail-label">Client Name:</div>
                <div className="detail-value font-semibold">{selectedOrder.customer}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Attention:</div>
                <div className="detail-value">{selectedOrder.contact}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Destination:</div>
                <div className="detail-value">{selectedOrder.destination}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Carrier & Tracking:</div>
                <div className="detail-value font-semibold">{selectedOrder.shippingCarrier} ({selectedOrder.trackingNumber})</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Payment Status:</div>
                <div className="detail-value font-semibold" style={{ color: 'var(--color-success-600)' }}>
                  {selectedOrder.paymentStatus}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
