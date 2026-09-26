import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  IndianRupee,
  PackageCheck,
  FileText,
  Trash2,
  ArrowRight,
  Boxes
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import { INITIAL_PURCHASE_ORDERS, INITIAL_SUPPLIERS, INITIAL_WAREHOUSES, INITIAL_PRODUCTS } from '../data/mockData';
import { hasPermission } from '../utils/permissions';

export default function PurchaseOrders({ onNotify, products, setProducts, currentUser }) {
  const canCreateReceipts = hasPermission.canCreateReceipts(currentUser?.role);
  const canValidateReceipts = hasPermission.canValidateReceipts(currentUser?.role);
  const location = useLocation();
  const [orders, setOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1: Supplier & Hub, 2: Line Items, 3: Review & Submit
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);

  // New PO State
  const [newPo, setNewPo] = useState({
    supplier: INITIAL_SUPPLIERS[0]?.name || '',
    warehouse: 'West Coast Hub',
    expectedDelivery: '2026-10-15',
    notes: '',
    items: [
      { product: INITIAL_PRODUCTS[0]?.name, sku: INITIAL_PRODUCTS[0]?.sku, qty: 30, unitCost: 210.00 }
    ]
  });

  // Calculate Order Totals
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
  };

  const handleOpenCreate = () => {
    setNewPo({
      supplier: INITIAL_SUPPLIERS[0]?.name || '',
      warehouse: 'West Coast Hub',
      expectedDelivery: '2026-10-15',
      notes: '',
      items: [
        { product: INITIAL_PRODUCTS[0]?.name, sku: INITIAL_PRODUCTS[0]?.sku, qty: 25, unitCost: INITIAL_PRODUCTS[0]?.costPrice || 50 }
      ]
    });
    setCreateStep(1);
    setIsCreateModalOpen(true);
  };

  // Quick Action auto-launch trigger
  useEffect(() => {
    if (location.state?.openModal === 'po') {
      handleOpenCreate();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddItemRow = () => {
    const defaultProd = products[0];
    setNewPo({
      ...newPo,
      items: [
        ...newPo.items,
        { product: defaultProd.name, sku: defaultProd.sku, qty: 10, unitCost: defaultProd.costPrice || 50 }
      ]
    });
  };

  const handleRemoveItemRow = (idx) => {
    if (newPo.items.length <= 1) return;
    setNewPo({
      ...newPo,
      items: newPo.items.filter((_, i) => i !== idx)
    });
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...newPo.items];
    if (field === 'product') {
      const p = products.find(prod => prod.name === val);
      updated[idx].product = val;
      if (p) {
        updated[idx].sku = p.sku;
        updated[idx].unitCost = p.costPrice || 50;
      }
    } else if (field === 'qty') {
      updated[idx].qty = parseInt(val, 10) || 0;
    } else if (field === 'unitCost') {
      updated[idx].unitCost = parseFloat(val) || 0;
    }
    setNewPo({ ...newPo, items: updated });
  };

  const handleSubmitPo = (status = 'Ordered') => {
    const total = calculateTotal(newPo.items);
    const createdPo = {
      id: `PO-2026-00${orders.length + 1}`,
      supplier: newPo.supplier,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDelivery: newPo.expectedDelivery,
      warehouse: newPo.warehouse,
      itemsCount: newPo.items.length,
      totalAmount: total,
      status: status,
      paymentStatus: 'Pending',
      items: newPo.items.map(item => ({
        ...item,
        total: item.qty * item.unitCost
      }))
    };

    setOrders([createdPo, ...orders]);
    setIsCreateModalOpen(false);
    onNotify(
      'Purchase Order Created',
      `PO #${createdPo.id} submitted to ${createdPo.supplier} for $${total.toLocaleString()}.`,
      'success'
    );
  };

  // Open Receive Goods Workflow
  const handleOpenReceive = (order, e) => {
    if (e) e.stopPropagation();
    setReceivingOrder({ ...order });
    setIsReceiveModalOpen(true);
  };

  // Confirm Received Goods -> update inventory stock directly
  const handleConfirmReceipt = () => {
    if (!receivingOrder) return;

    // Update product quantities in stock
    const updatedProducts = products.map(prod => {
      const match = receivingOrder.items.find(i => i.sku === prod.sku);
      if (match) {
        const newQty = prod.availableQty + match.qty;
        return {
          ...prod,
          availableQty: newQty,
          status: newQty > prod.reorderLevel ? 'In Stock' : 'Low Stock'
        };
      }
      return prod;
    });

    setProducts(updatedProducts);

    // Update order status
    setOrders(orders.map(o => o.id === receivingOrder.id ? { ...o, status: 'Received', paymentStatus: 'Paid' } : o));
    setIsReceiveModalOpen(false);
    onNotify(
      'Goods Received & Stock Updated',
      `Inventory checked into ${receivingOrder.warehouse}. Products available for order fulfillment.`,
      'success'
    );
  };

  // Columns definition
  const columns = [
    {
      header: 'PO Number',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-info-50)', color: 'var(--color-info-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-neutral-900)' }}>{row.id}</span>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.warehouse}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Vendor / Supplier',
      accessor: 'supplier',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>
          {row.supplier}
        </span>
      )
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
          {row.orderDate}
        </span>
      )
    },
    {
      header: 'Delivery ETA',
      accessor: 'expectedDelivery',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)' }}>
          <Calendar size={13} style={{ color: 'var(--color-primary-600)' }} />
          <span>{row.expectedDelivery}</span>
        </div>
      )
    },
    {
      header: 'Order Total',
      accessor: 'totalAmount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
          ₹{parseFloat(row.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'PO Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'supplier',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {canValidateReceipts && (row.status === 'Ordered' || row.status === 'Partially Received') && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={(e) => handleOpenReceive(row, e)}
              title="Record goods delivery into warehouse"
            >
              <PackageCheck size={13} />
              <span>Receive</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
            }}
          >
            Invoice
          </button>
        </div>
      )
    }
  ];

  const filterOptions = [
    { label: 'Ordered', value: 'Ordered' },
    { label: 'Partially Received', value: 'Partially Received' },
    { label: 'Received', value: 'Received' },
    { label: 'Draft', value: 'Draft' }
  ];

  return (
    <div className="purchase-orders-page animate-fade-in">
      {/* Read-Only Notice for Staff */}
      {!canCreateReceipts && (
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
          <ShoppingCart size={16} style={{ color: 'var(--color-neutral-600)', flexShrink: 0 }} />
          <span><strong>Inbound Tracking:</strong> Warehouse Staff profile has viewing access to purchase orders and expected shipment schedules. Creating and approving new POs is managed by Inventory Managers and Admins.</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Procurement</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Purchase Orders</span>
          </div>
          <h1 className="page-title">Inbound Purchase Orders & Replenishment</h1>
          <p className="page-subtitle">
            Draft, transmit, track delivery schedules, and receive incoming inventory shipments.
          </p>
        </div>

        <div className="page-header-actions">
          {canCreateReceipts ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Create Purchase Order</span>
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search by PO#, vendor, or warehouse..."
        filterOptions={filterOptions}
        filterKey="status"
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Guided 3-Step PO Creation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Guided Purchase Order Generator"
        subtitle={`Step ${createStep} of 3: ${createStep === 1 ? 'Select Supplier & Destination' : (createStep === 2 ? 'Add Items & Unit Costs' : 'Review & Finalize')}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {createStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateStep(prev => prev - 1)}
              >
                Back
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              {createStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCreateStep(prev => prev + 1)}
                >
                  Continue to Next Step
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSubmitPo('Draft')}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubmitPo('Ordered')}
                  >
                    Submit & Transmit PO
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      >
        {/* Progress Step Indicator */}
        <div className="progress-steps">
          <div className={`progress-step ${createStep >= 1 ? 'completed active' : ''}`}>
            <span className="step-number">1</span>
            <span>Vendor & Hub</span>
          </div>
          <div className={`step-connector ${createStep > 1 ? 'completed' : ''}`} />
          <div className={`progress-step ${createStep >= 2 ? 'completed active' : ''}`}>
            <span className="step-number">2</span>
            <span>Line Items</span>
          </div>
          <div className={`step-connector ${createStep > 2 ? 'completed' : ''}`} />
          <div className={`progress-step ${createStep === 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Summary & Signoff</span>
          </div>
        </div>

        {/* Step 1: Supplier & Hub */}
        {createStep === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Approved Supplier <span className="required">*</span></label>
              <select
                className="form-select"
                value={newPo.supplier}
                onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
              >
                {INITIAL_SUPPLIERS.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.location}) — Terms: {s.paymentTerms}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Receiving Warehouse Destination</label>
                <select
                  className="form-select"
                  value={newPo.warehouse}
                  onChange={(e) => setNewPo({ ...newPo, warehouse: e.target.value })}
                >
                  {INITIAL_WAREHOUSES.map(w => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPo.expectedDelivery}
                  onChange={(e) => setNewPo({ ...newPo, expectedDelivery: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Special Delivery / Packaging Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Include custom dock requirements, pallet tags, or QA certificate requirements..."
                value={newPo.notes}
                onChange={(e) => setNewPo({ ...newPo, notes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {createStep === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Order Line Items</span>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleAddItemRow}
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {newPo.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', background: 'var(--color-neutral-50)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '10px' }}>Product</label>
                    <select
                      className="form-select"
                      style={{ height: '34px', fontSize: '12px' }}
                      value={item.product}
                      onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.name}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '10px' }}>Units</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ height: '34px', fontSize: '12px' }}
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '10px' }}>Cost/Unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ height: '34px', fontSize: '12px' }}
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '10px' }}>Subtotal</label>
                    <div style={{ height: '34px', display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '12px' }}>
                      ₹{(item.qty * item.unitCost).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="action-menu-btn"
                      onClick={() => handleRemoveItemRow(idx)}
                      style={{ marginTop: '16px', color: 'var(--color-danger-500)' }}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-neutral-900)' }}>
              Subtotal: ₹{calculateTotal(newPo.items).toFixed(2)}
            </div>
          </div>
        )}

        {/* Step 3: Review & Summary */}
        {createStep === 3 && (
          <div>
            <div className="card" style={{ background: 'var(--color-neutral-50)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Vendor</span>
                  <div style={{ fontWeight: 600 }}>{newPo.supplier}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Destination Hub</span>
                  <div style={{ fontWeight: 600 }}>{newPo.warehouse}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Delivery Target</span>
                  <div>{newPo.expectedDelivery}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Total Line Items</span>
                  <div>{newPo.items.length} items</div>
                </div>
              </div>
            </div>

            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {newPo.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className="font-semibold">{item.product}</div>
                      <div style={{ color: 'var(--color-neutral-400)' }}>{item.sku}</div>
                    </td>
                    <td>{item.qty} units</td>
                    <td>₹{item.unitCost.toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>₹{(item.qty * item.unitCost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary-800)' }}>Net Purchase Authorization Total</span>
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-700)' }}>
                ₹{calculateTotal(newPo.items).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Goods Received Workflow Modal */}
      {receivingOrder && (
        <Modal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          title={`Inbound Goods Receipt — ${receivingOrder.id}`}
          subtitle={`Check in freight from ${receivingOrder.supplier} to ${receivingOrder.warehouse}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReceiveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmReceipt}
              >
                <PackageCheck size={16} />
                <span>Confirm All Received & Restock</span>
              </button>
            </div>
          }
        >
          <div>
            <div className="alert alert-info" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <PackageCheck size={16} className="shrink-0" />
              <span>
                Confirming physical receipt will immediately replenish inventory in <strong>{receivingOrder.warehouse}</strong> and record an audit entry.
              </span>
            </div>

            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Verified OK</th>
                </tr>
              </thead>
              <tbody>
                {receivingOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold">{item.name || item.product}</div>
                      <div style={{ color: 'var(--color-neutral-400)' }}>{item.sku}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.qty} units</td>
                    <td>
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> 100% Inspected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* PO Invoice Preview Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Purchase Order: ${selectedOrder.id}`}
          subtitle={`Supplier: ${selectedOrder.supplier} • Status: ${selectedOrder.status}`}
          size="md"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedOrder(null)}
            >
              Close Preview
            </button>
          }
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--color-neutral-200)', paddingBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Vendor</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.supplier}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Ship To</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.warehouse}</div>
              </div>
            </div>

            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)', marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || item.product}</td>
                    <td>{item.qty}</td>
                    <td>₹{item.unitCost}</td>
                    <td style={{ fontWeight: 600 }}>₹{item.total || (item.qty * item.unitCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--color-neutral-900)' }}>
              Total: ₹{selectedOrder.totalAmount.toLocaleString()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
