import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Filter,
  Download,
  Upload,
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  QrCode,
  Tag,
  DollarSign,
  Boxes,
  Sliders,
  X
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_WAREHOUSES, INITIAL_SUPPLIERS } from '../data/mockData';

export default function Products({ products, setProducts, onNotify }) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create' | 'edit'
  const [activeDrawerTab, setActiveDrawerTab] = useState('basic');
  const [viewProductModal, setViewProductModal] = useState(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    barcode: '',
    category: 'Sensors & IoT',
    price: 99.00,
    costPrice: 60.00,
    availableQty: 50,
    reservedQty: 0,
    reorderLevel: 20,
    warehouse: 'West Coast Hub',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'Apex Dynamics Corp',
    description: '',
    taxRate: 8.5,
    variationColor: 'Standard',
    image: '📦'
  });

  // Open Create Drawer
  const handleOpenCreate = () => {
    setDrawerMode('create');
    setFormData({
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
      category: 'Sensors & IoT',
      price: 120.00,
      costPrice: 75.00,
      availableQty: 45,
      reservedQty: 0,
      reorderLevel: 25,
      warehouse: 'West Coast Hub',
      status: 'In Stock',
      unit: 'pcs',
      supplier: 'Apex Dynamics Corp',
      description: '',
      taxRate: 8.5,
      variationColor: 'Standard',
      image: '📦'
    });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (product, e) => {
    if (e) e.stopPropagation();
    setDrawerMode('edit');
    setFormData({ ...product });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  // Save product
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert('Please fill in required fields (Name, SKU).');
      return;
    }

    // Determine status automatically based on availableQty vs reorderLevel
    let computedStatus = 'In Stock';
    if (formData.availableQty === 0) {
      computedStatus = 'Out of Stock';
    } else if (formData.availableQty <= formData.reorderLevel) {
      computedStatus = 'Low Stock';
    }

    const payload = {
      ...formData,
      status: computedStatus,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      availableQty: parseInt(formData.availableQty, 10) || 0,
      reorderLevel: parseInt(formData.reorderLevel, 10) || 0
    };

    if (drawerMode === 'create') {
      setProducts([payload, ...products]);
      onNotify('Product Created', `Added ${payload.name} (${payload.sku}) to catalog.`, 'success');
    } else {
      setProducts(products.map(p => p.id === payload.id ? payload : p));
      onNotify('Product Updated', `Updated specifications for ${payload.name}.`, 'info');
    }

    setIsDrawerOpen(false);
  };

  // Bulk actions
  const handleSelectAll = (checked, pageData) => {
    if (checked) {
      setSelectedRows(pageData.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to remove ${selectedRows.length} selected items?`)) return;
    setProducts(products.filter(p => !selectedRows.includes(p.id)));
    setSelectedRows([]);
    onNotify('Bulk Action', 'Selected products have been removed.', 'warning');
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Product Name & SKU',
      accessor: 'name',
      render: (row) => (
        <div className="table-product-cell">
          <div className="table-product-img">
            {row.image || '📦'}
          </div>
          <div className="table-product-info">
            <div className="table-product-name">{row.name}</div>
            <div className="table-product-sku">
              SKU: {row.sku} • Barcode: {row.barcode}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, background: 'var(--color-neutral-100)', padding: '3px 8px', borderRadius: 'var(--radius-md)' }}>
          {row.category}
        </span>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
          {row.warehouse}
        </span>
      )
    },
    {
      header: 'Selling Price',
      accessor: 'price',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          ${parseFloat(row.price).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Available Stock',
      accessor: 'availableQty',
      render: (row) => {
        let stockColor = 'var(--color-success-600)';
        if (row.availableQty === 0) stockColor = 'var(--color-danger-600)';
        else if (row.availableQty <= row.reorderLevel) stockColor = 'var(--color-warning-600)';

        return (
          <div>
            <span style={{ fontWeight: 700, color: stockColor }}>
              {row.availableQty} {row.unit}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
              Reserved: {row.reservedQty} | Min: {row.reorderLevel}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Stock Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="action-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setViewProductModal(row);
            }}
            title="View full product profile"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="action-menu-btn"
            onClick={(e) => handleOpenEdit(row, e)}
            title="Edit product"
          >
            <Edit2 size={15} />
          </button>
        </div>
      )
    }
  ];

  // Category filter options
  const filterOptions = [
    { label: 'Sensors & IoT', value: 'Sensors & IoT' },
    { label: 'Actuators', value: 'Actuators' },
    { label: 'Controllers', value: 'Controllers' },
    { label: 'Pneumatics', value: 'Pneumatics' },
    { label: 'Networking', value: 'Networking' }
  ];

  return (
    <div className="products-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Inventory</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Products Catalog</span>
          </div>
          <h1 className="page-title">Product Catalog & Master Records</h1>
          <p className="page-subtitle">
            Manage SKU specifications, barcode generation, inventory thresholds, and multi-tier pricing.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNotify('Import CSV', 'Bulk CSV template downloaded. Ready for CSV batch import.', 'info')}
          >
            <Upload size={15} />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Banner if selected */}
      {selectedRows.length > 0 && (
        <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              {selectedRows.length} products selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => onNotify('Bulk Warehouse', 'Bulk reassigned to West Coast Hub.', 'success')}
            >
              Reassign Hub
            </button>
            <button
              type="button"
              className="btn btn-danger btn-xs"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search by name, SKU, barcode, supplier..."
        filterOptions={filterOptions}
        filterKey="category"
        selectedRows={selectedRows}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onRowClick={(row) => setViewProductModal(row)}
      />

      {/* Add / Edit Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerMode === 'create' ? 'Create New Catalog Product' : `Edit Product: ${formData.name}`}
        subtitle="Specify product attributes, inventory thresholds, and warehouse assignments"
        width="580px"
        footer={
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveProduct}
            >
              {drawerMode === 'create' ? 'Publish Product' : 'Save Modifications'}
            </button>
          </div>
        }
      >
        {/* Drawer Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('basic')}
          >
            General & Specs
          </button>
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('pricing')}
          >
            Pricing & Margins
          </button>
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('stock')}
          >
            Inventory & Hub
          </button>
        </div>

        {/* Tab 1: Basic Info */}
        {activeDrawerTab === 'basic' && (
          <div>
            <div className="form-group">
              <label className="form-label">
                Product Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Industrial Torque Sensor TS-90"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  SKU Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SEN-TRQ-90"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Barcode (EAN / UPC)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="8901234567890"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {INITIAL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Supplier</label>
                <select
                  className="form-select"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  {INITIAL_SUPPLIERS.map(sup => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Detailed technical specifications, operating tolerances, voltage, and compliance notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Display Emoji / Icon</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['⚡', '⚙️', '🎯', '🗜️', '🎛️', '📷', '🔌', '🔩', '📦'].map(emo => (
                  <button
                    key={emo}
                    type="button"
                    className={`btn btn-sm ${formData.image === emo ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '18px', width: '36px', height: '36px', padding: 0 }}
                    onClick={() => setFormData({ ...formData, image: emo })}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pricing & Tax */}
        {activeDrawerTab === 'pricing' && (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
            </div>

            {/* Calculated Profit Margin Widget */}
            <div style={{ padding: '14px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-200)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-800)' }}>
                  Gross Profit Margin
                </span>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                  {formData.price > 0 ? (((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-primary-600)', marginTop: '4px' }}>
                Gross margin calculated per unit sold: ${Math.max(0, formData.price - formData.costPrice).toFixed(2)}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measure</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="rolls">Rolls</option>
                  <option value="box">Box / Pack</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="meter">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory & Warehouse */}
        {activeDrawerTab === 'stock' && (
          <div>
            <div className="form-group">
              <label className="form-label">Assigned Primary Warehouse</label>
              <select
                className="form-select"
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              >
                {INITIAL_WAREHOUSES.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name} ({wh.location})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Initial Available Stock</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.availableQty}
                  onChange={(e) => setFormData({ ...formData, availableQty: e.target.value })}
                />
                <span className="form-hint">Physical stock available for allocation</span>
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Safety Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
                <span className="form-hint">Triggers automated low-stock warnings</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Detailed Product Profile Modal */}
      {viewProductModal && (
        <Modal
          isOpen={!!viewProductModal}
          onClose={() => setViewProductModal(null)}
          title={viewProductModal.name}
          subtitle={`SKU: ${viewProductModal.sku} • Category: ${viewProductModal.category}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={viewProductModal.status} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewProductModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const prod = viewProductModal;
                    setViewProductModal(null);
                    handleOpenEdit(prod);
                  }}
                >
                  Edit Specifications
                </button>
              </div>
            </div>
          }
        >
          <div className="detail-grid">
            <div>
              {/* Product Overview Section */}
              <div className="detail-section">
                <h4 className="detail-section-title">Product Specifications</h4>
                <div className="detail-row">
                  <div className="detail-label">Description:</div>
                  <div className="detail-value">{viewProductModal.description || 'No custom description provided.'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Supplier:</div>
                  <div className="detail-value font-semibold">{viewProductModal.supplier}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Barcode EAN-13:</div>
                  <div className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {viewProductModal.barcode}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Selling Price:</div>
                  <div className="detail-value font-bold" style={{ color: 'var(--color-primary-700)' }}>
                    ${parseFloat(viewProductModal.price).toFixed(2)}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Cost of Goods:</div>
                  <div className="detail-value">${parseFloat(viewProductModal.costPrice).toFixed(2)}</div>
                </div>
              </div>

              {/* Stock Movement History for this product */}
              <div className="detail-section">
                <h4 className="detail-section-title">Recent Stock Audit Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item completed">
                    <div className="timeline-dot" />
                    <div className="timeline-title">Routine QA Count Verified</div>
                    <div className="timeline-desc">Physical stock aligned at {viewProductModal.warehouse}</div>
                    <div className="timeline-time">Today, 09:30 AM • Sarah Jenkins</div>
                  </div>
                  <div className="timeline-item completed">
                    <div className="timeline-dot" />
                    <div className="timeline-title">Replenished via PO-2026-001</div>
                    <div className="timeline-desc">+40 units received into primary racking</div>
                    <div className="timeline-time">Sep 20, 2026 • Logistics Team</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Metric Card */}
            <div>
              <div className="card" style={{ background: 'var(--color-neutral-50)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '12px', color: 'var(--color-neutral-800)' }}>
                  Warehouse Stock Telemetry
                </h4>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>Current Location</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{viewProductModal.warehouse}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ padding: '8px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Available</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                      {viewProductModal.availableQty}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Reserved</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning-600)' }}>
                      {viewProductModal.reservedQty}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Stock Safety Ratio</span>
                    <span style={{ fontWeight: 600 }}>
                      {viewProductModal.reorderLevel > 0 
                        ? Math.min(100, Math.round((viewProductModal.availableQty / (viewProductModal.reorderLevel * 2)) * 100)) 
                        : 100}%
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((viewProductModal.availableQty / (viewProductModal.reorderLevel * 2 || 1)) * 100))}%`,
                        background: viewProductModal.availableQty <= viewProductModal.reorderLevel ? 'var(--color-warning-500)' : 'var(--color-success-500)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
