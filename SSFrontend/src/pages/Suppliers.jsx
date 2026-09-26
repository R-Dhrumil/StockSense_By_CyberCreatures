import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  IndianRupee,
  Package,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';

import { hasPermission } from '../utils/permissions';
import { supplierApi } from '../services/api';

export default function Suppliers({ onNotify, currentUser }) {
  const canManageSuppliers = hasPermission.canCreateReceipts(currentUser?.role);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    rating: 4.8,
    leadTimeDays: 10,
    paymentTerms: 'Net 30',
    suppliedCategories: 'Sensors & IoT, Actuators'
  });

  // Fetch Suppliers from Database / Backend API
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getSuppliers();
      const list = res?.data?.suppliers || [];
      setSuppliers(list);
    } catch (err) {
      console.error('Failed to load suppliers from database:', err);
      onNotify('Error Loading Suppliers', err.message || 'Could not fetch suppliers from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      location: '',
      rating: 4.5,
      leadTimeDays: 7,
      paymentTerms: 'Net 30',
      suppliedCategories: 'Sensors & IoT, Actuators'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup, e) => {
    if (e) e.stopPropagation();
    setModalMode('edit');
    setFormData({
      ...sup,
      contactPerson: sup.contactPerson || sup.contact_person || '',
      leadTimeDays: sup.leadTimeDays || sup.lead_time_days || 7,
      paymentTerms: sup.paymentTerms || sup.payment_terms || 'Net 30',
      suppliedCategories: Array.isArray(sup.suppliedCategories)
        ? sup.suppliedCategories.join(', ')
        : (sup.suppliedCategories || sup.supplied_categories || '')
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name || !formData.email) {
      onNotify('Validation Error', 'Supplier Legal Name and Email are required', 'warning');
      return;
    }

    const formattedCategories = typeof formData.suppliedCategories === 'string'
      ? formData.suppliedCategories
      : (Array.isArray(formData.suppliedCategories) ? formData.suppliedCategories.join(', ') : '');

    const payload = {
      name: formData.name.trim(),
      contactPerson: (formData.contactPerson || '').trim(),
      email: formData.email.trim(),
      phone: (formData.phone || '').trim(),
      location: (formData.location || '').trim(),
      rating: parseFloat(formData.rating) || 4.5,
      leadTimeDays: parseInt(formData.leadTimeDays, 10) || 7,
      paymentTerms: formData.paymentTerms || 'Net 30',
      suppliedCategories: formattedCategories,
      activeOrders: parseInt(formData.activeOrders || 0, 10)
    };

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await supplierApi.createSupplier(payload);
        const created = res?.data?.supplier;
        if (created) {
          setSuppliers(prev => [created, ...prev]);
          onNotify('Supplier Added', `${created.name} successfully registered in database.`, 'success');
        } else {
          await loadSuppliers();
          onNotify('Supplier Added', 'New vendor saved to database.', 'success');
        }
      } else {
        const res = await supplierApi.updateSupplier(formData.id, payload);
        const updated = res?.data?.supplier;
        if (updated) {
          setSuppliers(prev => prev.map(s => s.id === formData.id ? updated : s));
          if (selectedSupplier?.id === formData.id) {
            setSelectedSupplier(updated);
          }
        } else {
          await loadSuppliers();
        }
        onNotify('Supplier Updated', `Updated vendor record for ${payload.name} in database.`, 'info');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save supplier to database:', err);
      onNotify('Save Failed', err.message || 'Error saving supplier to database', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplierId, supplierName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${supplierName}?`)) return;
    try {
      await supplierApi.deleteSupplier(supplierId);
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(null);
      }
      onNotify('Supplier Deactivated', `${supplierName} removed from active vendor directory.`, 'info');
    } catch (err) {
      onNotify('Delete Failed', err.message || 'Could not deactivate supplier', 'error');
    }
  };

  // Columns definition
  const columns = [
    {
      header: 'Vendor Name & ID',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{row.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.id} • {row.paymentTerms}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Key Contact Person',
      accessor: 'contactPerson',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-800)' }}>{row.contactPerson}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Phone & Location',
      accessor: 'phone',
      render: (row) => (
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-700)' }}>{row.phone}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.location}</div>
        </div>
      )
    },
    {
      header: 'Lead Time',
      accessor: 'leadTimeDays',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-sm)' }}>
          <Clock size={13} style={{ color: 'var(--color-primary-600)' }} />
          <span>{row.leadTimeDays} days avg</span>
        </div>
      )
    },
    {
      header: 'Performance Rating',
      accessor: 'rating',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{row.rating}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>/ 5.0</span>
        </div>
      )
    },
    {
      header: 'Active POs',
      accessor: 'activeOrders',
      render: (row) => (
        <span style={{
          display: 'inline-flex',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: row.activeOrders > 0 ? 'var(--color-info-50)' : 'var(--color-neutral-100)',
          color: row.activeOrders > 0 ? 'var(--color-info-700)' : 'var(--color-neutral-500)',
          fontWeight: 600,
          fontSize: '11px'
        }}>
          {row.activeOrders} Active
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="action-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSupplier(row);
            }}
            title="View Details"
          >
            <ExternalLink size={15} />
          </button>
          {canManageSuppliers && (
            <>
              <button
                type="button"
                className="action-menu-btn"
                onClick={(e) => handleOpenEdit(row, e)}
                title="Edit Vendor"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                className="action-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSupplier(row.id, row.name);
                }}
                title="Deactivate Vendor"
                style={{ color: 'var(--color-danger-600)' }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="suppliers-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Procurement</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Supplier Directory</span>
          </div>
          <h1 className="page-title">Vendor & Supplier Relations</h1>
          <p className="page-subtitle">
            Manage vendor agreements, delivery lead times, payment terms, and active purchase contracts.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadSuppliers}
            disabled={loading}
            title="Reload from Database"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {canManageSuppliers ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Directory View
            </span>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={loading}
        emptyMessage="No suppliers found in database. Click 'Add Supplier' to register a vendor."
        searchPlaceholder="Search vendor name, contact person, or location..."
        onRowClick={(row) => setSelectedSupplier(row)}
      />

      {/* Supplier Profile Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={selectedSupplier.name}
          subtitle={`Vendor ID: ${selectedSupplier.id} • ${selectedSupplier.location}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={15} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                <span style={{ fontWeight: 700 }}>{selectedSupplier.rating} Verified Rating</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedSupplier(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const sup = selectedSupplier;
                    setSelectedSupplier(null);
                    handleOpenEdit(sup);
                  }}
                >
                  Edit Vendor
                </button>
              </div>
            </div>
          }
        >
          <div className="detail-grid">
            <div>
              <div className="detail-section">
                <h4 className="detail-section-title">Vendor Contacts & Commercial Terms</h4>
                <div className="detail-row">
                  <div className="detail-label">Lead Account Executive:</div>
                  <div className="detail-value font-semibold">{selectedSupplier.contactPerson}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Direct Corporate Email:</div>
                  <div className="detail-value">{selectedSupplier.email}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Headquarters / Depot:</div>
                  <div className="detail-value">{selectedSupplier.location}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Standard Payment Terms:</div>
                  <div className="detail-value font-semibold">{selectedSupplier.paymentTerms}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Average Order Lead Time:</div>
                  <div className="detail-value">{selectedSupplier.leadTimeDays} business days</div>
                </div>
              </div>

              {/* Purchase History with this vendor */}
              <div className="detail-section">
                <h4 className="detail-section-title">Recent Purchase Orders</h4>
                <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Order Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[].filter(po => po.supplier === selectedSupplier.name).map(po => (
                      <tr key={po.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{po.id}</td>
                        <td>{po.orderDate}</td>
                        <td style={{ fontWeight: 600 }}>₹{po.totalAmount.toLocaleString()}</td>
                        <td>{po.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="card" style={{ background: 'var(--color-neutral-50)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '12px' }}>
                  Supplied Product Lines
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedSupplier.suppliedCategories || []).map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-neutral-200)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Package size={14} style={{ color: 'var(--color-primary-600)' }} />
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New Supplier' : `Edit Supplier: ${formData.name}`}
        subtitle="Manage vendor contact coordinates and delivery SLAs"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? 'Saving to Database...' : (modalMode === 'create' ? 'Save Vendor' : 'Update Vendor')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Company / Vendor Legal Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apex Dynamics Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                placeholder="David Sterling"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email <span className="required">*</span></label>
              <input
                type="email"
                className="form-input"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Direct Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 (555) 012-3456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Headquarters Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="Chicago, IL, USA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lead Time (Days)</label>
              <input
                type="number"
                className="form-input"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="form-select"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Due on Receipt">Due on Receipt (Prepaid)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplied Product Lines (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Sensors, Actuators, Pneumatics"
              value={formData.suppliedCategories}
              onChange={(e) => setFormData({ ...formData, suppliedCategories: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
