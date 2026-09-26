import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  User,
  Phone,
  Mail,
  Box,
  IndianRupee,
  TrendingUp,
  LayoutGrid,
  List,
  Edit2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { INITIAL_WAREHOUSES, INITIAL_PRODUCTS } from '../data/mockData';

export default function Warehouses({ onNotify }) {
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    manager: '',
    email: '',
    phone: '',
    capacity: 10000,
    status: 'Operational'
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `HUB-0${warehouses.length + 1}`,
      location: '',
      manager: '',
      email: '',
      phone: '',
      capacity: 12000,
      status: 'Operational'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveWarehouse = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;

    const newWh = {
      id: `WH-0${warehouses.length + 1}`,
      ...formData,
      usedCapacity: 0,
      totalProducts: 0,
      inventoryValue: 0
    };

    setWarehouses([...warehouses, newWh]);
    setIsAddModalOpen(false);
    onNotify('Facility Added', `Warehouse ${newWh.name} is now online and available for routing.`, 'success');
  };

  const totalCapacity = warehouses.reduce((acc, w) => acc + w.capacity, 0);
  const totalUsedCapacity = warehouses.reduce((acc, w) => acc + w.usedCapacity, 0);
  const overallUtilization = Math.round((totalUsedCapacity / totalCapacity) * 100) || 0;
  const totalNetworkValue = warehouses.reduce((acc, w) => acc + w.inventoryValue, 0);

  return (
    <div className="warehouses-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Logistics</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Warehouses</span>
          </div>
          <h1 className="page-title">Fulfillment Hubs & Facilities</h1>
          <p className="page-subtitle">
            Manage multi-location storage capacity, facility managers, and inventory distribution.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon primary">
            <WarehouseIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              {warehouses.length} Active Hubs
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Total Network Facilities
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon warning">
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              {overallUtilization}% Utilized
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              {totalUsedCapacity.toLocaleString()} / {totalCapacity.toLocaleString()} Units
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon success">
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              ₹{totalNetworkValue.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Total Stored Asset Value
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-neutral-100)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn btn-xs ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={`btn btn-xs ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid-2">
          {warehouses.map((wh) => {
            const utilization = Math.round((wh.usedCapacity / wh.capacity) * 100);
            return (
              <div
                key={wh.id}
                className="warehouse-card"
                onClick={() => setSelectedWarehouse(wh)}
              >
                <div className="warehouse-card-header">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="warehouse-icon">
                      <WarehouseIcon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                        {wh.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{wh.location}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={wh.status} />
                </div>

                <div style={{ margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-neutral-500)' }}>Capacity Utilization</span>
                    <span style={{ fontWeight: 600, color: utilization > 85 ? 'var(--color-warning-600)' : 'var(--color-neutral-700)' }}>
                      {utilization}% ({wh.usedCapacity.toLocaleString()} / {wh.capacity.toLocaleString()} units)
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${utilization}%`,
                        background: utilization > 85 ? 'var(--color-warning-500)' : 'var(--color-primary-500)'
                      }}
                    />
                  </div>
                </div>

                <div className="warehouse-stats">
                  <div>
                    <div className="warehouse-stat-label">Facility Manager</div>
                    <div className="warehouse-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} style={{ color: 'var(--color-primary-600)' }} />
                      <span>{wh.manager}</span>
                    </div>
                  </div>
                  <div>
                    <div className="warehouse-stat-label">Stored Inventory Value</div>
                    <div className="warehouse-stat-value" style={{ color: 'var(--color-primary-700)' }}>
                      ₹{wh.inventoryValue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    View Facility Breakdown <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code & Facility</th>
                <th>Location</th>
                <th>Manager</th>
                <th>Capacity</th>
                <th>Catalog SKUs</th>
                <th>Inventory Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((wh) => (
                <tr
                  key={wh.id}
                  onClick={() => setSelectedWarehouse(wh)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{wh.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{wh.code}</div>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
                    {wh.location}
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{wh.manager}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{wh.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{Math.round((wh.usedCapacity / wh.capacity) * 100)}%</span>
                    <span style={{ color: 'var(--color-neutral-400)', fontSize: '11px' }}> ({wh.usedCapacity}/{wh.capacity})</span>
                  </td>
                  <td>{wh.totalProducts} items</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>
                    ₹{wh.inventoryValue.toLocaleString()}
                  </td>
                  <td><StatusBadge status={wh.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warehouse Detail Modal */}
      {selectedWarehouse && (
        <Modal
          isOpen={!!selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          title={selectedWarehouse.name}
          subtitle={`Facility Code: ${selectedWarehouse.code} • ${selectedWarehouse.location}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={selectedWarehouse.status} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedWarehouse(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="detail-grid">
            <div>
              <div className="detail-section">
                <h4 className="detail-section-title">Facility Information</h4>
                <div className="detail-row">
                  <div className="detail-label">Address / Location:</div>
                  <div className="detail-value">{selectedWarehouse.location}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Site Operations Director:</div>
                  <div className="detail-value font-semibold">{selectedWarehouse.manager}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Direct Contact Email:</div>
                  <div className="detail-value">{selectedWarehouse.email}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Direct Operations Phone:</div>
                  <div className="detail-value">{selectedWarehouse.phone}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Operational Status:</div>
                  <div className="detail-value font-semibold" style={{ color: 'var(--color-success-600)' }}>
                    Fully Integrated & Barcode Enabled
                  </div>
                </div>
              </div>

              {/* Sample Stored Stock List */}
              <div className="detail-section">
                <h4 className="detail-section-title">Stock Stored in this Hub</h4>
                <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_PRODUCTS.slice(0, 4).map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                        <td style={{ fontWeight: 600 }}>{p.availableQty} {p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="card" style={{ background: 'var(--color-neutral-50)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '12px' }}>
                  Capacity & Valuation
                </h4>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Stored Value</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                    ₹{selectedWarehouse.inventoryValue.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Used Capacity</span>
                    <span style={{ fontWeight: 600 }}>{Math.round((selectedWarehouse.usedCapacity / selectedWarehouse.capacity) * 100)}%</span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${Math.round((selectedWarehouse.usedCapacity / selectedWarehouse.capacity) * 100)}%`,
                        background: 'var(--color-primary-500)'
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-neutral-400)', marginTop: '6px' }}>
                    {selectedWarehouse.usedCapacity.toLocaleString()} of {selectedWarehouse.capacity.toLocaleString()} bin slots occupied
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Warehouse Facility"
        subtitle="Establish a new fulfillment depot or distribution center"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveWarehouse}
            >
              Register Facility
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveWarehouse}>
          <div className="form-group">
            <label className="form-label">Facility Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Midwest Logistics Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Warehouse Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="MLH-05"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Storage Bins (Capacity)</label>
              <input
                type="number"
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">City, State / Country <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Chicago, Illinois, USA"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Site Operations Manager</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Thomas Drake"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manager Direct Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="t.drake@stocksense.io"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
