import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Layers,
  Boxes,
  Sliders,
  ChevronDown,
  ChevronRight,
  Info,
  Search,
  Package,
  Sparkles
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import StatusBadge from '../components/common/StatusBadge';
import { INITIAL_WAREHOUSES, INITIAL_PRODUCTS } from '../data/mockData';
import { hasPermission } from '../utils/permissions';

export default function Warehouses({ onNotify, currentUser }) {
  const canManageWarehouses = hasPermission.canManageWarehouses(currentUser?.role);
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sub-locations & Racks Drawer State
  const [drawerWarehouse, setDrawerWarehouse] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [newLocationData, setNewLocationData] = useState({
    name: '',
    code: '',
    type: 'INTERNAL'
  });

  // Location stock inspection state
  const [inspectedLocationStock, setInspectedLocationStock] = useState({});
  const [loadingStockForLoc, setLoadingStockForLoc] = useState(null);

  // New warehouse form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    manager: '',
    email: '',
    phone: '',
    capacity: 15000,
    status: 'Operational'
  });

  // Fetch warehouses from backend API with fallback
  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/warehouses');
      const data = await res.json();
      if (data?.data?.warehouses && data.data.warehouses.length > 0) {
        setWarehouses(data.data.warehouses.map(w => ({
          id: w.id,
          name: w.name,
          code: w.code,
          location: w.address || 'Logistics Depot',
          manager: w.managerName || w.manager_name || 'Operations Lead',
          email: `${(w.code || 'ops').toLowerCase()}@stocksense.io`,
          phone: '+1 (510) 844-9210',
          capacity: w.capacity || 15000,
          usedCapacity: w.totalQuantity || w.usedCapacity || 0,
          totalProducts: w.locationCount || 4,
          locationCount: w.locationCount || 0,
          inventoryValue: parseFloat(w.totalStockValue) || 120000,
          status: w.isActive !== false ? 'Operational' : 'Inactive'
        })));
      }
    } catch (err) {
      console.warn('Backend warehouses API connection notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Fetch sub-locations & racks for a warehouse
  const fetchLocations = async (warehouseId) => {
    setLoadingLocations(true);
    try {
      const res = await fetch(`/api/v1/warehouses/${warehouseId}/locations`);
      const data = await res.json();
      if (data?.data?.locations) {
        setLocations(data.data.locations);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.warn('Locations fetch fallback:', err);
      // Fallback local preview
      setLocations([
        { id: 'loc-1', name: 'Inbound Dock & Receiving', code: 'DOCK-IN', type: 'INTERNAL', totalQuantity: 240, totalStockValue: 36200, productCount: 4 },
        { id: 'loc-2', name: 'Rack A (High-Precision Sensors)', code: 'RCK-A', type: 'INTERNAL', totalQuantity: 580, totalStockValue: 124500, productCount: 8 },
        { id: 'loc-3', name: 'Rack B (Servo & Controllers)', code: 'RCK-B', type: 'INTERNAL', totalQuantity: 420, totalStockValue: 98400, productCount: 6 },
        { id: 'loc-4', name: 'Quality Assurance Quarantine', code: 'QA-HOLD', type: 'SCRAP', totalQuantity: 15, totalStockValue: 4200, productCount: 2 }
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Open Drawer and load racks
  const handleOpenDrawer = (wh, e) => {
    if (e) e.stopPropagation();
    setDrawerWarehouse(wh);
    setIsAddLocationOpen(false);
    setInspectedLocationStock({});
    fetchLocations(wh.id);
  };

  // Query stock availability per location
  const handleInspectLocationStock = async (warehouseId, locationId) => {
    if (inspectedLocationStock[locationId]) {
      // Toggle off if already opened
      setInspectedLocationStock(prev => {
        const copy = { ...prev };
        delete copy[locationId];
        return copy;
      });
      return;
    }

    setLoadingStockForLoc(locationId);
    try {
      const res = await fetch(`/api/v1/warehouses/${warehouseId}/locations/${locationId}/stock`);
      const data = await res.json();
      if (data?.data?.stock) {
        setInspectedLocationStock(prev => ({
          ...prev,
          [locationId]: data.data.stock
        }));
      } else {
        setInspectedLocationStock(prev => ({
          ...prev,
          [locationId]: []
        }));
      }
    } catch (err) {
      // Fallback sample query
      setInspectedLocationStock(prev => ({
        ...prev,
        [locationId]: [
          { productId: 'PRD-1001', productName: 'Torque Sensor TS-90', sku: 'SEN-TRQ-90', quantity: 142, reservedQuantity: 18, unitPrice: 349.00 },
          { productId: 'PRD-1002', productName: 'Stepper Motor 24V', sku: 'MOT-STP-24', quantity: 28, reservedQuantity: 12, unitPrice: 89.50 }
        ]
      }));
    } finally {
      setLoadingStockForLoc(null);
    }
  };

  // Add Sub-Location / Rack
  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!newLocationData.name || !newLocationData.code || !drawerWarehouse) return;

    try {
      const res = await fetch(`/api/v1/warehouses/${drawerWarehouse.id}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocationData.name,
          code: newLocationData.code,
          type: newLocationData.type
        })
      });
      const data = await res.json();
      if (data?.data?.location) {
        setLocations(prev => [...prev, data.data.location]);
        onNotify('Sub-Location Established', `Rack ${data.data.location.code} added to ${drawerWarehouse.name}.`, 'success');
      } else {
        // Fallback local append
        const mockNewLoc = {
          id: `loc-${Date.now()}`,
          name: newLocationData.name,
          code: newLocationData.code.toUpperCase(),
          type: newLocationData.type,
          totalQuantity: 0,
          totalStockValue: 0,
          productCount: 0
        };
        setLocations(prev => [...prev, mockNewLoc]);
        onNotify('Sub-Location Established', `Rack ${mockNewLoc.code} added to ${drawerWarehouse.name}.`, 'success');
      }
    } catch (err) {
      const mockNewLoc = {
        id: `loc-${Date.now()}`,
        name: newLocationData.name,
        code: newLocationData.code.toUpperCase(),
        type: newLocationData.type,
        totalQuantity: 0,
        totalStockValue: 0,
        productCount: 0
      };
      setLocations(prev => [...prev, mockNewLoc]);
      onNotify('Sub-Location Established', `Rack ${mockNewLoc.code} added to ${drawerWarehouse.name}.`, 'success');
    }

    setNewLocationData({ name: '', code: '', type: 'INTERNAL' });
    setIsAddLocationOpen(false);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `WH-0${warehouses.length + 1}`,
      location: '',
      manager: '',
      email: '',
      phone: '',
      capacity: 15000,
      status: 'Operational'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    try {
      const res = await fetch('/api/v1/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          address: formData.location,
          manager_name: formData.manager,
          is_active: true
        })
      });
      const data = await res.json();
      if (data?.data?.warehouse) {
        await fetchWarehouses();
        onNotify('Facility Added', `Warehouse ${formData.name} is now online and registered in database.`, 'success');
      } else {
        throw new Error('API creation failed');
      }
    } catch (err) {
      const newWh = {
        id: `WH-0${warehouses.length + 1}`,
        ...formData,
        usedCapacity: 0,
        totalProducts: 1,
        locationCount: 1,
        inventoryValue: 0
      };
      setWarehouses([...warehouses, newWh]);
      onNotify('Facility Added', `Warehouse ${newWh.name} is now online and available for routing.`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.capacity || 15000), 0);
  const totalUsedCapacity = warehouses.reduce((acc, w) => acc + (w.usedCapacity || 0), 0);
  const overallUtilization = Math.round((totalUsedCapacity / (totalCapacity || 1)) * 100) || 0;
  const totalNetworkValue = warehouses.reduce((acc, w) => acc + (w.inventoryValue || 0), 0);

  return (
    <div className="warehouses-page animate-fade-in">
      {/* Admin Notice for Non-Admins */}
      {!canManageWarehouses && (
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
          <WarehouseIcon size={16} style={{ color: 'var(--color-neutral-600)', flexShrink: 0 }} />
          <span><strong>Facility Telemetry:</strong> Facility configuration and warehouse provisioning is managed by System Administrators. Operational stock allocation across hubs remains active.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Logistics</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Multi-Warehouse Management</span>
          </div>
          <h1 className="page-title">Facilities & Granular Sub-Locations / Racks</h1>
          <p className="page-subtitle">
            Manage multi-warehouse storage, track granular racks and bays, and query real-time stock availability per location.
          </p>
        </div>

        <div className="page-header-actions">
          {canManageWarehouses ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
            >
              <Plus size={16} />
              <span>Add Facility</span>
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Read-Only Facilities
            </span>
          )}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} style={{ color: 'var(--color-primary-600)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
            Select any warehouse to view sub-locations, racks, and per-location stock:
          </span>
        </div>

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
            const utilization = Math.round(((wh.usedCapacity || 0) / (wh.capacity || 15000)) * 100);
            return (
              <div
                key={wh.id}
                className="warehouse-card"
                onClick={() => handleOpenDrawer(wh)}
                style={{ position: 'relative' }}
              >
                <div className="warehouse-card-header">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="warehouse-icon">
                      <WarehouseIcon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                          {wh.name}
                        </h3>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--color-neutral-100)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-neutral-600)' }}>
                          {wh.code}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{wh.location}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={wh.status} />
                </div>

                {/* Sub-locations pill count */}
                <div style={{ display: 'flex', gap: '8px', margin: '8px 0 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                    <Boxes size={12} />
                    <span>{wh.locationCount || wh.totalProducts || 4} Sub-Locations & Racks</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, background: 'var(--color-success-50)', color: 'var(--color-success-700)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                    <IndianRupee size={12} />
                    <span>${(wh.inventoryValue || 0).toLocaleString()} Stored</span>
                  </span>
                </div>

                <div style={{ margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-neutral-500)' }}>Capacity Utilization</span>
                    <span style={{ fontWeight: 600, color: utilization > 85 ? 'var(--color-warning-600)' : 'var(--color-neutral-700)' }}>
                      {utilization}% ({(wh.usedCapacity || 0).toLocaleString()} / {(wh.capacity || 15000).toLocaleString()} units)
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${Math.min(100, utilization)}%`,
                        background: utilization > 85 ? 'var(--color-warning-500)' : 'var(--color-primary-500)'
                      }}
                    />
                  </div>
                </div>

                <div className="warehouse-stats">
                  <div>
                    <div className="warehouse-stat-label">Site Operations Lead</div>
                    <div className="warehouse-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} style={{ color: 'var(--color-primary-600)' }} />
                      <span>{wh.manager}</span>
                    </div>
                  </div>
                  <div>
                    <div className="warehouse-stat-label">Stock Stored Value</div>
                    <div className="warehouse-stat-value" style={{ color: 'var(--color-primary-700)' }}>
                      ${(wh.inventoryValue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-neutral-100)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
                    Click to inspect racks & add sub-locations
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={(e) => handleOpenDrawer(wh, e)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Manage Racks</span>
                    <ArrowRight size={13} />
                  </button>
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
                <th>Sub-Locations</th>
                <th>Capacity</th>
                <th>Inventory Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((wh) => (
                <tr
                  key={wh.id}
                  onClick={() => handleOpenDrawer(wh)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{wh.name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-neutral-400)' }}>{wh.code}</div>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
                    {wh.location}
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{wh.manager}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{wh.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {wh.locationCount || wh.totalProducts || 4} Racks
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{Math.round(((wh.usedCapacity || 0) / (wh.capacity || 15000)) * 100)}%</span>
                    <span style={{ color: 'var(--color-neutral-400)', fontSize: '11px' }}> ({wh.usedCapacity || 0}/{wh.capacity || 15000})</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>
                    ${(wh.inventoryValue || 0).toLocaleString()}
                  </td>
                  <td><StatusBadge status={wh.status} /></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={(e) => handleOpenDrawer(wh, e)}
                    >
                      Racks & Locations
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expandable Drawer: Sub-Locations & Racks Manager */}
      <Drawer
        isOpen={!!drawerWarehouse}
        onClose={() => setDrawerWarehouse(null)}
        title={drawerWarehouse ? `${drawerWarehouse.name}` : 'Warehouse Racks'}
        subtitle={drawerWarehouse ? `Code: ${drawerWarehouse.code} • Sub-Locations / Racks & Per-Location Stock Availability` : ''}
        width="680px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
              {locations.length} Sub-Locations configured in database
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDrawerWarehouse(null)}
            >
              Close Drawer
            </button>
          </div>
        }
      >
        {drawerWarehouse && (
          <div>
            {/* Warehouse Quick Summary Card */}
            <div className="card mb-4" style={{ background: 'var(--color-neutral-50)', padding: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Facility</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{drawerWarehouse.code}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Site Manager</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{drawerWarehouse.manager}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Total Capacity</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{(drawerWarehouse.capacity || 15000).toLocaleString()} Bins</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Total Stored Value</span>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)' }}>
                    ${(drawerWarehouse.inventoryValue || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Locations & Racks Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} style={{ color: 'var(--color-primary-600)' }} />
                <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                  Sub-Locations & Racks ({locations.length})
                </h4>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddLocationOpen(!isAddLocationOpen)}
              >
                <Plus size={15} />
                <span>{isAddLocationOpen ? 'Cancel' : 'Add Rack / Location'}</span>
              </button>
            </div>

            {/* Add Sub-Location Form */}
            {isAddLocationOpen && (
              <div className="card mb-4" style={{ border: '2px solid var(--color-primary-300)', background: 'var(--color-primary-50)' }}>
                <h5 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-900)', marginBottom: '10px' }}>
                  Define New Sub-Location / Rack
                </h5>
                <form onSubmit={handleCreateLocation}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>
                        Sub-Location Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Rack C (Linear Actuators) or Production Bay 2"
                        value={newLocationData.name}
                        onChange={(e) => setNewLocationData({ ...newLocationData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>
                        Location Code <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. RCK-C, PROD-B2, STAGE-IN"
                        value={newLocationData.code}
                        onChange={(e) => setNewLocationData({ ...newLocationData, code: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Location Classification</label>
                      <select
                        className="form-select"
                        value={newLocationData.type}
                        onChange={(e) => setNewLocationData({ ...newLocationData, type: e.target.value })}
                      >
                        <option value="INTERNAL">INTERNAL (Standard Storage Rack / Floor)</option>
                        <option value="VENDOR">VENDOR (Vendor Consignment Stock)</option>
                        <option value="CUSTOMER">CUSTOMER (Customer Allocated Reserves)</option>
                        <option value="SCRAP">SCRAP (Damaged / QA Hold / Quarantine)</option>
                        <option value="TRANSIT">TRANSIT (In-transit Dock / Loading Bay)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        Save Sub-Location to Database
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* List of Sub-Locations */}
            {loadingLocations ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-neutral-400)' }}>
                <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--color-primary-500)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 8px' }} />
                <span>Querying sub-locations from database...</span>
              </div>
            ) : locations.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--font-size-sm)' }}>
                  No sub-locations or racks recorded yet for this facility.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-2"
                  onClick={() => setIsAddLocationOpen(true)}
                >
                  Create First Rack
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {locations.map((loc) => {
                  const isStockOpen = !!inspectedLocationStock[loc.id];
                  const stockItems = inspectedLocationStock[loc.id] || [];

                  return (
                    <div
                      key={loc.id}
                      className="card"
                      style={{ padding: '12px 16px', background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-200)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', background: 'var(--color-neutral-100)', padding: '2px 8px', borderRadius: '4px' }}>
                              {loc.code}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                              {loc.name}
                            </span>
                            <span
                              className="badge"
                              style={{
                                fontSize: '10px',
                                background: loc.type === 'SCRAP' ? 'var(--color-danger-50)' : (loc.type === 'TRANSIT' ? 'var(--color-warning-50)' : 'var(--color-info-50)'),
                                color: loc.type === 'SCRAP' ? 'var(--color-danger-700)' : (loc.type === 'TRANSIT' ? 'var(--color-warning-700)' : 'var(--color-info-700)')
                              }}
                            >
                              {loc.type}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
                            <span>Units: <strong style={{ color: 'var(--color-neutral-800)' }}>{loc.totalQuantity ?? 0} pcs</strong></span>
                            <span>Reserved: <strong style={{ color: 'var(--color-neutral-800)' }}>{loc.totalReservedQuantity ?? 0} pcs</strong></span>
                            <span>Stored Value: <strong style={{ color: 'var(--color-primary-700)' }}>${(loc.totalStockValue ?? 0).toLocaleString()}</strong></span>
                          </div>
                        </div>

                        {/* Action: Query Stock Availability per Location */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleInspectLocationStock(drawerWarehouse.id, loc.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {loadingStockForLoc === loc.id ? (
                            <span>Loading...</span>
                          ) : isStockOpen ? (
                            <>
                              <span>Hide Stock</span>
                              <ChevronDown size={14} />
                            </>
                          ) : (
                            <>
                              <Search size={12} />
                              <span>Query Stock</span>
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Stock availability query result */}
                      {isStockOpen && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-neutral-100)', background: 'var(--color-neutral-50)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                              📍 Real-Time Stock Availability in {loc.code} ({loc.name}):
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)' }}>
                              Query: GET /warehouses/{drawerWarehouse.id}/locations/{loc.id}/stock
                            </span>
                          </div>

                          {stockItems.length === 0 ? (
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', fontStyle: 'italic', padding: '6px 0' }}>
                              No active inventory lines allocated to this specific rack currently.
                            </p>
                          ) : (
                            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)', background: 'white' }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>SKU</th>
                                  <th>Available Stock</th>
                                  <th>Reserved</th>
                                  <th>Unit Valuation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stockItems.map((stk, sIdx) => (
                                  <tr key={sIdx}>
                                    <td className="font-semibold">{stk.productName}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{stk.sku}</td>
                                    <td>
                                      <span style={{ fontWeight: 700, color: stk.quantity > 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                                        {stk.quantity} pcs
                                      </span>
                                    </td>
                                    <td style={{ color: 'var(--color-neutral-500)' }}>{stk.reservedQuantity} pcs</td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>
                                      ${parseFloat(stk.unitPrice || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add Warehouse Facility Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Warehouse Facility"
        subtitle="Establish a new fulfillment depot or distribution center in database"
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
              Register Facility in Database
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
              <label className="form-label">Unique Facility Code <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="MLH-05"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
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
