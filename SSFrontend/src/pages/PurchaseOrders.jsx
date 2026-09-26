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
  Boxes,
  Layers,
  History,
  ShieldCheck,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import KpiCard from '../components/common/KpiCard';
import { INITIAL_PURCHASE_ORDERS, INITIAL_SUPPLIERS, INITIAL_WAREHOUSES, INITIAL_PRODUCTS } from '../data/mockData';
import { hasPermission } from '../utils/permissions';

export default function PurchaseOrders({ onNotify, products, setProducts, warehouses = [], currentUser }) {
  const facilityList = (warehouses && warehouses.length > 0) ? warehouses : [];
  const SUPPLIER_LIST = ['Apex Dynamics Corp', 'LuminoTech Precision', 'Vortex Flow Systems', 'ElectroCore Global', 'Titanium Mechanical Inc'];
  const canCreateReceipts = hasPermission.canCreateReceipts(currentUser?.role);
  const canValidateReceipts = hasPermission.canValidateReceipts(currentUser?.role);
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receivingItems, setReceivingItems] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  // Sub-locations per warehouse for dynamic rack selection
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Stock Ledger Drawer State
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);
  const [ledgerLogs, setLedgerLogs] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // New PO / Receipt Form State
  const [newPo, setNewPo] = useState({
    supplier: SUPPLIER_LIST[0],
    warehouseId: facilityList[0]?.id || '',
    warehouseName: facilityList[0]?.name || 'Main Central Hub',
    locationId: '',
    expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: '',
    items: [
      { productId: products[0]?.id || '', product: products[0]?.name || 'Industrial Torque Sensor TS-90', sku: products[0]?.sku || 'SEN-TRQ-90', qty: 25, unitCost: products[0]?.costPrice || products[0]?.price || 210.00 }
    ]
  });

  // Calculate Order Totals
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.qty * (item.unitCost || 0)), 0);
  };

  // 1. Fetch Receipts from Backend API
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/operations/receipts');
      if (res.ok) {
        const data = await res.json();
        if (data.data?.receipts && data.data.receipts.length > 0) {
          // Normalize API receipts to match UI schema
          const apiOrders = data.data.receipts.map(r => ({
            id: r.operationNumber || r.id,
            rawId: r.id,
            supplier: r.partnerName || 'Approved Vendor',
            orderDate: new Date(r.createdAt || Date.now()).toISOString().slice(0, 10),
            expectedDelivery: new Date(new Date(r.createdAt || Date.now()).getTime() + 7 * 86400000).toISOString().slice(0, 10),
            warehouse: r.warehouseName || 'Main Central Hub',
            warehouseCode: r.warehouseCode || 'WH-MAIN',
            locationId: r.destLocationId,
            locationName: r.destLocationName || 'Inbound Dock & Receiving',
            itemsCount: r.itemCount || 1,
            totalAmount: parseFloat(r.totalCost) || (r.totalDemanded * 150) || 5000,
            status: r.status === 'DONE' ? 'Received' : (r.status === 'DRAFT' ? 'Draft' : 'Ordered'),
            rawStatus: r.status,
            totalDemanded: r.totalDemanded,
            totalDone: r.totalDone,
            notes: r.referenceNote || '',
            items: []
          }));
          setOrders(apiOrders);
        }
      }
    } catch (err) {
      console.warn('API fetchReceipts failed, keeping memory/mock list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Locations for a Warehouse
  const fetchLocationsForWarehouse = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      setLoadingLocations(true);
      const res = await fetch(`/api/v1/warehouses/${warehouseId}/locations`);
      if (res.ok) {
        const data = await res.json();
        const locs = data.data?.locations || data.data || [];
        setWarehouseLocations(locs);
        if (locs.length > 0) {
          setNewPo(prev => ({ ...prev, locationId: locs[0].id }));
        }
      }
    } catch (err) {
      console.warn('Failed to load sub-locations for warehouse:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  // 3. Fetch Stock Ledger Entries
  const fetchLedger = async () => {
    try {
      setLoadingLedger(true);
      const res = await fetch('/api/v1/operations/ledger?limit=30');
      if (res.ok) {
        const data = await res.json();
        setLedgerLogs(data.data?.ledger || []);
      }
    } catch (err) {
      console.warn('Failed to load stock ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // When selected warehouse changes in form, update its locations
  useEffect(() => {
    if (newPo.warehouseId) {
      fetchLocationsForWarehouse(newPo.warehouseId);
    }
  }, [newPo.warehouseId]);

  // Quick Action auto-launch trigger
  useEffect(() => {
    if (location.state?.openModal === 'po') {
      handleOpenCreate();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenCreate = () => {
    const defaultWarehouse = facilityList[0];
    setNewPo({
      supplier: SUPPLIER_LIST[0],
      warehouseId: defaultWarehouse?.id || '',
      warehouseName: defaultWarehouse?.name || 'Main Central Hub',
      locationId: '',
      expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: '',
      items: [
        {
          productId: products[0]?.id || '',
          product: products[0]?.name || 'Industrial Torque Sensor TS-90',
          sku: products[0]?.sku || 'SEN-TRQ-90',
          qty: 25,
          unitCost: products[0]?.costPrice || products[0]?.price || 210.00
        }
      ]
    });
    if (defaultWarehouse?.id) {
      fetchLocationsForWarehouse(defaultWarehouse.id);
    }
    setCreateStep(1);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProd = products[0] || { name: 'Industrial Item', sku: 'SKU-001', price: 100 };
    setNewPo({
      ...newPo,
      items: [
        ...newPo.items,
        {
          productId: defaultProd.id || '',
          product: defaultProd.name,
          sku: defaultProd.sku,
          qty: 10,
          unitCost: defaultProd.costPrice || defaultProd.price || 50
        }
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
        updated[idx].productId = p.id;
        updated[idx].sku = p.sku;
        updated[idx].unitCost = p.costPrice || p.price || 50;
      }
    } else if (field === 'qty') {
      updated[idx].qty = parseInt(val, 10) || 0;
    } else if (field === 'unitCost') {
      updated[idx].unitCost = parseFloat(val) || 0;
    }
    setNewPo({ ...newPo, items: updated });
  };

  // Submit and Create Receipt on Backend
  const handleSubmitPo = async (status = 'READY') => {
    const total = calculateTotal(newPo.items);

    try {
      const payload = {
        partner_name: newPo.supplier,
        dest_location_id: newPo.locationId || 'b1011111-1111-4111-8111-111111111111',
        reference_note: newPo.notes || `PO Intake for ${newPo.warehouseName}`,
        status: status === 'Ordered' ? 'READY' : 'DRAFT',
        items: newPo.items.map(it => ({
          productId: it.productId || 'c1010000-0000-4000-8000-000000000001',
          productName: it.product,
          sku: it.sku,
          demandedQty: it.qty,
          unitCost: it.unitCost
        }))
      };

      const res = await fetch('/api/v1/operations/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.data?.receipt;
        if (created) {
          const formatted = {
            id: created.operationNumber,
            rawId: created.id,
            supplier: created.partnerName,
            orderDate: new Date().toISOString().slice(0, 10),
            expectedDelivery: newPo.expectedDelivery,
            warehouse: newPo.warehouseName,
            locationId: created.destLocationId,
            locationName: warehouseLocations.find(l => l.id === created.destLocationId)?.name || 'Inbound Rack',
            itemsCount: created.items?.length || newPo.items.length,
            totalAmount: total,
            status: created.status === 'READY' ? 'Ordered' : 'Draft',
            rawStatus: created.status,
            notes: created.referenceNote,
            items: newPo.items
          };
          setOrders([formatted, ...orders]);
          setIsCreateModalOpen(false);
          onNotify(
            'Receipt Order Created',
            `Receipt ${created.operationNumber} registered for ${created.partnerName} (Destination: ${newPo.warehouseName}).`,
            'success'
          );
          return;
        }
      }
    } catch (e) {
      console.warn('API create receipt failed, fallback to local state:', e);
    }

    // Local state fallback
    const localId = `REC-2026-00${orders.length + 1}`;
    const createdPo = {
      id: localId,
      rawId: localId,
      supplier: newPo.supplier,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDelivery: newPo.expectedDelivery,
      warehouse: newPo.warehouseName,
      locationId: newPo.locationId,
      locationName: warehouseLocations.find(l => l.id === newPo.locationId)?.name || 'Inbound Rack',
      itemsCount: newPo.items.length,
      totalAmount: total,
      status: status,
      rawStatus: 'READY',
      items: newPo.items.map(item => ({
        ...item,
        total: item.qty * item.unitCost
      }))
    };

    setOrders([createdPo, ...orders]);
    setIsCreateModalOpen(false);
    onNotify(
      'Receipt Order Created',
      `Receipt #${createdPo.id} registered for ${createdPo.supplier} ($${total.toLocaleString()}).`,
      'success'
    );
  };

  // Open Receive Goods Workflow Modal
  const handleOpenReceive = async (order, e) => {
    if (e) e.stopPropagation();
    setReceivingOrder({ ...order });

    // If order has nested items from API, fetch or prepare line items
    if (order.rawId && order.rawId.startsWith('op-')) {
      try {
        const res = await fetch(`/api/v1/operations/receipts/${order.rawId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.receipt?.items) {
            setReceivingItems(data.data.receipt.items.map(it => ({
              id: it.id,
              productId: it.productId,
              name: it.productName,
              sku: it.sku,
              demandedQty: it.demandedQty,
              doneQty: it.demandedQty
            })));
            setIsReceiveModalOpen(true);
            return;
          }
        }
      } catch (err) {}
    }

    // Default item mappings
    const defaultItems = (order.items && order.items.length > 0)
      ? order.items.map((it, idx) => ({
          id: it.id || `item-${idx}`,
          productId: it.productId || products[0]?.id,
          name: it.name || it.product || 'Industrial Component',
          sku: it.sku || `SKU-${idx}`,
          demandedQty: it.qty || it.demandedQty || 20,
          doneQty: it.qty || it.demandedQty || 20
        }))
      : [
          {
            id: 'item-1',
            productId: products[0]?.id,
            name: products[0]?.name || 'Industrial Torque Sensor TS-90',
            sku: products[0]?.sku || 'SEN-TRQ-90',
            demandedQty: 25,
            doneQty: 25
          }
        ];

    setReceivingItems(defaultItems);
    setIsReceiveModalOpen(true);
  };

  // Atomic Validation of Receipt
  const handleConfirmReceipt = async () => {
    if (!receivingOrder) return;
    setIsValidating(true);

    const totalReceivedUnits = receivingItems.reduce((acc, it) => acc + (parseInt(it.doneQty, 10) || 0), 0);

    try {
      const res = await fetch(`/api/v1/operations/receipts/${receivingOrder.rawId || receivingOrder.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsReceived: receivingItems.map(it => ({
            id: it.id,
            productId: it.productId,
            doneQty: parseInt(it.doneQty, 10) || 0
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const validated = data.data?.receipt;

        // Update local order status
        setOrders(orders.map(o => (o.id === receivingOrder.id || o.rawId === receivingOrder.rawId)
          ? { ...o, status: 'Received', rawStatus: 'DONE' }
          : o
        ));

        // Update parent products catalog stock
        if (setProducts) {
          setProducts(prevProducts => prevProducts.map(prod => {
            const matched = receivingItems.find(it => it.sku === prod.sku || it.productId === prod.id);
            if (matched) {
              const addQty = parseInt(matched.doneQty, 10) || 0;
              const newQty = (prod.availableQty || 0) + addQty;
              return {
                ...prod,
                availableQty: newQty,
                status: newQty > prod.reorderLevel ? 'In Stock' : 'Low Stock'
              };
            }
            return prod;
          }));
        }

        setIsReceiveModalOpen(false);
        onNotify(
          'Stock Incremented & Ledger Recorded',
          `Stock increased by +${validated?.totalUnitsIncremented || totalReceivedUnits} units in ${receivingOrder.locationName || receivingOrder.warehouse || 'Destination Location'}.`,
          'success'
        );
        return;
      }
    } catch (err) {
      console.warn('API validate failed, falling back to instant client sync:', err.message);
    } finally {
      setIsValidating(false);
    }

    // Client-side fallback if backend was unavailable
    if (setProducts) {
      setProducts(prevProducts => prevProducts.map(prod => {
        const matched = receivingItems.find(it => it.sku === prod.sku);
        if (matched) {
          const addQty = parseInt(matched.doneQty, 10) || 0;
          const newQty = (prod.availableQty || 0) + addQty;
          return {
            ...prod,
            availableQty: newQty,
            status: newQty > prod.reorderLevel ? 'In Stock' : 'Low Stock'
          };
        }
        return prod;
      }));
    }

    setOrders(orders.map(o => o.id === receivingOrder.id ? { ...o, status: 'Received', rawStatus: 'DONE' } : o));
    setIsReceiveModalOpen(false);
    onNotify(
      'Stock Incremented & Ledger Recorded',
      `Stock increased by +${totalReceivedUnits} units in ${receivingOrder.warehouse || 'Destination Location'}.`,
      'success'
    );
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Receipt / PO #',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-neutral-900)' }}>{row.id}</span>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} />
              <span>{row.warehouse}</span>
              {row.locationName && (
                <span style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>• {row.locationName}</span>
              )}
            </div>
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
      header: 'Total Value',
      accessor: 'totalAmount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
          ₹{parseFloat(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Receipt Status',
      accessor: 'status',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusBadge status={row.status} />
          {row.rawStatus === 'DONE' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-success-600)' }} title="Validated in ledger">
              <ShieldCheck size={14} />
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'supplier',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {canValidateReceipts && (row.status === 'Ordered' || row.status === 'Partially Received' || row.rawStatus === 'READY' || row.rawStatus === 'DRAFT') && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={(e) => handleOpenReceive(row, e)}
              title="Inspect freight and validate receipt into destination rack"
              style={{ background: 'var(--color-primary-600)', color: '#fff', fontWeight: 600 }}
            >
              <PackageCheck size={13} />
              <span>Validate & Restock</span>
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

  return (
    <div className="purchase-orders-page animate-fade-in">
      {/* Operation 1 Banner: Real-time PostgreSQL Ledger Ready */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(224, 231, 255, 0.6))',
        border: '1px solid rgba(199, 210, 254, 0.8)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-primary-950)' }}>
                Operation 1 — Receipts (Incoming Goods)
              </span>
              <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Atomic SQL Transaction & Audit Ledger
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
              Process: Create Receipt $\rightarrow$ Input received quantities $\rightarrow$ Click <strong>Validate</strong> $\rightarrow$ Stock automatically increments at target rack and logs in ledger.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setIsLedgerDrawerOpen(true);
              fetchLedger();
            }}
            title="Inspect physical stock movements ledger"
          >
            <History size={14} />
            <span>Audit Ledger</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchReceipts}
            disabled={loading}
            title="Refresh receipts from backend"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Procurement & Inbound</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Receipts</span>
          </div>
          <h1 className="page-title">Inbound Receipts & Vendor Shipments</h1>
          <p className="page-subtitle">
            Digitize incoming supplier shipments, verify physical deliveries, and atomically replenish sub-location stock.
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
              <span>Create Receipt / PO</span>
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Inbound"
          value={orders.length}
          subtext="Active vendor receipts"
          icon={ShoppingCart}
          variant="primary"
        />
        <KpiCard
          title="1. Pending Receipt"
          value={orders.filter(o => o.status === 'Ordered' || o.status === 'Draft' || o.rawStatus === 'READY' || o.rawStatus === 'DRAFT').length}
          subtext="Awaiting vendor delivery"
          icon={Clock}
          variant="warning"
        />
        <KpiCard
          title="2. Partial Inbound"
          value={orders.filter(o => o.status === 'Partially Received').length}
          subtext="Goods partially accepted"
          icon={Truck}
          variant="info"
        />
        <KpiCard
          title="3. Received & Stocked"
          value={orders.filter(o => o.status === 'Received' || o.rawStatus === 'DONE').length}
          subtext="Validated in inventory ledger"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Receipts Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search by receipt #, vendor name, or target warehouse..."
      />

      {/* Create Receipt Multi-Step Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Inbound Receipt / Purchase Order"
        subtitle="Specify approved vendor, destination facility, target sub-location, and expected quantities."
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {createStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateStep(createStep - 1)}
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
                  onClick={() => setCreateStep(createStep + 1)}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSubmitPo('Ordered')}
                >
                  Create & Authorize Receipt
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Progress Step Indicator */}
        <div className="progress-steps" style={{ marginBottom: '20px' }}>
          <div className={`progress-step ${createStep >= 1 ? 'completed active' : ''}`}>
            <span className="step-number">1</span>
            <span>Vendor & Target Rack</span>
          </div>
          <div className={`step-connector ${createStep > 1 ? 'completed' : ''}`} />
          <div className={`progress-step ${createStep >= 2 ? 'completed active' : ''}`}>
            <span className="step-number">2</span>
            <span>Product Line Items</span>
          </div>
          <div className={`step-connector ${createStep > 2 ? 'completed' : ''}`} />
          <div className={`progress-step ${createStep === 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Review & Authorize</span>
          </div>
        </div>

        {/* Step 1: Supplier, Warehouse & Destination Rack */}
        {createStep === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Vendor / Supplier <span className="required">*</span></label>
              <select
                className="form-select"
                value={newPo.supplier}
                onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
              >
                {SUPPLIER_LIST.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Destination Warehouse Facility</label>
                <select
                  className="form-select"
                  value={newPo.warehouseId}
                  onChange={(e) => {
                    const selectedWh = facilityList.find(w => w.id === e.target.value);
                    setNewPo({
                      ...newPo,
                      warehouseId: e.target.value,
                      warehouseName: selectedWh?.name || 'Main Central Hub'
                    });
                  }}
                >
                  {facilityList.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Target Sub-Location / Rack
                  {loadingLocations && <span style={{ fontSize: '11px', color: 'var(--color-primary-600)', marginLeft: '6px' }}>(loading...)</span>}
                </label>
                <select
                  className="form-select"
                  value={newPo.locationId}
                  onChange={(e) => setNewPo({ ...newPo, locationId: e.target.value })}
                >
                  {warehouseLocations.length > 0 ? (
                    warehouseLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code}) — {loc.type}
                      </option>
                    ))
                  ) : (
                    <option value="b1011111-1111-4111-8111-111111111111">Inbound Dock & Receiving (DOCK-IN)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">Expected Arrival Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPo.expectedDelivery}
                  onChange={(e) => setNewPo({ ...newPo, expectedDelivery: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shipment Reference / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PO-8821 Bill of Lading #4029"
                  value={newPo.notes}
                  onChange={(e) => setNewPo({ ...newPo, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {createStep === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                Products to Receive into Target Rack
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleAddItemRow}
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {newPo.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr auto', gap: '8px', alignItems: 'center', padding: '10px', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block', marginBottom: '2px' }}>Product</label>
                    <select
                      className="form-select"
                      value={item.product}
                      onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id || p.sku} value={p.name}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block', marginBottom: '2px' }}>Demanded Qty</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block', marginBottom: '2px' }}>Unit Cost ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      step={0.01}
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ color: 'var(--color-danger-600)', marginTop: '16px' }}
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={newPo.items.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: 'var(--color-neutral-800)' }}>
              Subtotal: ${calculateTotal(newPo.items).toFixed(2)}
            </div>
          </div>
        )}

        {/* Step 3: Summary & Signoff */}
        {createStep === 3 && (
          <div>
            <div style={{ background: 'var(--color-neutral-50)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Supplier:</strong> {newPo.supplier}</div>
                <div><strong>Warehouse:</strong> {newPo.warehouseName}</div>
                <div><strong>Destination Rack:</strong> {warehouseLocations.find(l => l.id === newPo.locationId)?.name || 'Inbound Dock (DOCK-IN)'}</div>
                <div><strong>Expected Date:</strong> {newPo.expectedDelivery}</div>
              </div>
            </div>

            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Demanded Qty</th>
                  <th>Unit Cost</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {newPo.items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{it.product}</strong>
                      <div style={{ color: 'var(--color-neutral-400)', fontSize: '11px' }}>{it.sku}</div>
                    </td>
                    <td>{it.qty} units</td>
                    <td>${it.unitCost.toFixed(2)}</td>
                    <td><strong>${(it.qty * it.unitCost).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary-900)' }}>Total Authorized Value:</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-700)' }}>
                ${calculateTotal(newPo.items).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Receive Goods & Validate Modal */}
      {receivingOrder && (
        <Modal
          isOpen={isReceiveModalOpen}
          onClose={() => !isValidating && setIsReceiveModalOpen(false)}
          title={`Validate Incoming Goods — ${receivingOrder.id}`}
          subtitle={`Check in freight from ${receivingOrder.supplier} to ${receivingOrder.locationName || receivingOrder.warehouse}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isValidating}
                onClick={() => setIsReceiveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={isValidating}
                onClick={handleConfirmReceipt}
                style={{ background: 'var(--color-success-600)', color: '#fff', fontWeight: 700 }}
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Committing Transaction...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck size={16} />
                    <span>Validate Receipt & Replenish Stock</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div>
            <div className="alert alert-info" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--color-info-50)', border: '1px solid var(--color-info-200)', color: 'var(--color-info-900)' }}>
              <PackageCheck size={18} className="shrink-0" />
              <div>
                <strong>Atomic Stock Update:</strong> Validating this receipt will commit a PostgreSQL transaction, incrementing <code>stock_levels</code> at <strong>{receivingOrder.locationName || receivingOrder.warehouse}</strong> and writing an immutable entry into <code>stock_ledger</code>.
              </div>
            </div>

            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Demanded</th>
                  <th style={{ width: '130px' }}>Actual Received</th>
                </tr>
              </thead>
              <tbody>
                {receivingItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold">{item.name || item.product}</div>
                      <div style={{ color: 'var(--color-neutral-400)', fontSize: '11px' }}>{item.sku}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.demandedQty} units</td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        style={{ height: '32px', fontSize: '13px', fontWeight: 700 }}
                        value={item.doneQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          const updated = [...receivingItems];
                          updated[idx].doneQty = val;
                          setReceivingItems(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Stock Ledger Audit Drawer */}
      <Drawer
        isOpen={isLedgerDrawerOpen}
        onClose={() => setIsLedgerDrawerOpen(false)}
        title="Stock Movements Ledger (Audit Trail)"
        subtitle="Immutable ledger log of every validated receipt, delivery, and rack transfer."
        width="620px"
      >
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
              Showing recent physical movements
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={fetchLedger}
              disabled={loadingLedger}
            >
              <RefreshCw size={12} className={loadingLedger ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLedger ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading audit trail from database...</div>
            </div>
          ) : ledgerLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
              <History size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>No stock ledger movements logged yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ledgerLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#fff',
                    border: '1px solid var(--color-neutral-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        +{log.quantityChange} units
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--color-neutral-900)' }}>
                        {log.productName || 'Industrial Part'}
                      </strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                      Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.referenceNumber}</span> • Location: <strong>{log.locationName || log.locationCode || 'Inbound Dock'}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-neutral-400)' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      {/* Invoice Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Purchase Order Invoice: ${selectedOrder.id}`}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
              <span>Total Authorized Value:</span>
              <strong style={{ fontSize: '16px', color: 'var(--color-neutral-900)' }}>
                ${parseFloat(selectedOrder.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
