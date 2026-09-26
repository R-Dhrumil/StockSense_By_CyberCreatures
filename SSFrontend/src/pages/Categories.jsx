import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Archive,
  RotateCcw,
  Package,
  IndianRupee,
  Search
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { categoryApi } from '../services/api';

export default function Categories({ onNotify }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    status: 'Active',
    icon: 'Layers'
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await categoryApi.getCategories();
      if (res?.data?.categories && res.data.categories.length > 0) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.warn('Backend categories fallback to cached list:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalProducts = categories.reduce((acc, c) => acc + (parseInt(c.count, 10) || 0), 0);
  const totalValuation = categories.reduce((acc, c) => acc + (parseFloat(c.stockValue) || 0), 0);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: '',
      name: '',
      description: '',
      status: 'Active',
      icon: 'Layers'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setModalMode('edit');
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleToggleArchive = async (cat) => {
    const newStatus = cat.status === 'Active' ? 'Archived' : 'Active';
    try {
      await categoryApi.updateCategory(cat.id, { status: newStatus });
      setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
      onNotify(
        newStatus === 'Archived' ? 'Category Archived' : 'Category Restored',
        `${cat.name} marked as ${newStatus}.`,
        newStatus === 'Archived' ? 'warning' : 'success'
      );
    } catch (err) {
      // Fallback
      setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
      onNotify('Status Updated', `${cat.name} marked as ${newStatus}.`, 'info');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (modalMode === 'create') {
        const res = await categoryApi.createCategory(formData);
        const newCat = res?.data?.category || {
          ...formData,
          id: `CAT-${Date.now().toString().slice(-3)}`,
          count: 0,
          stockValue: 0
        };
        setCategories([...categories, newCat]);
        onNotify('Category Created', `New category ${newCat.name} saved to database.`, 'success');
      } else {
        const res = await categoryApi.updateCategory(formData.id, formData);
        const updated = res?.data?.category || formData;
        setCategories(categories.map(c => c.id === formData.id ? { ...c, ...updated } : c));
        onNotify('Category Updated', `Updated details for ${formData.name}.`, 'info');
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error saving category');
    }
  };

  return (
    <div className="categories-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Inventory</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Categories</span>
          </div>
          <h1 className="page-title">Category Taxonomy & Grouping</h1>
          <p className="page-subtitle">
            Organize catalog hierarchy, track inventory valuation per category, and manage active classifications.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon primary">
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              {categories.filter(c => c.status === 'Active').length}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Active Product Categories
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon info">
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              {totalProducts}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Total Categorized SKUs
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon success">
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              ₹{totalValuation.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Cumulative Stock Value
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card mb-6" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
            <div className="table-search" style={{ width: '100%', maxWidth: '320px' }}>
              <Search size={16} className="table-search-icon" />
              <input
                type="text"
                className="table-search-input"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'Active', 'Archived'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* View mode toggle */}
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
      </div>

      {/* Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid-3">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Layers size={22} />
                  </div>
                  <StatusBadge status={cat.status} />
                </div>

                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: '4px' }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', minHeight: '36px', lineHeight: 1.4 }}>
                  {cat.description}
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-neutral-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Products</span>
                    <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                      {cat.count} SKUs
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Valuation</span>
                    <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                      ₹{cat.stockValue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => handleOpenEdit(cat)}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleToggleArchive(cat)}
                  >
                    {cat.status === 'Active' ? <Archive size={13} /> : <RotateCcw size={13} />}
                    <span>{cat.status === 'Active' ? 'Archive' : 'Restore'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Products Count</th>
                <th>Inventory Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', maxWidth: '280px' }}>
                    {cat.description}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{cat.count}</span> SKUs
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>
                      ₹{cat.stockValue.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={cat.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleOpenEdit(cat)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleToggleArchive(cat)}
                      >
                        {cat.status === 'Active' ? <Archive size={13} /> : <RotateCcw size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Category' : `Edit Category: ${formData.name}`}
        subtitle="Organize product lines for consolidated reporting and stock audits"
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
              onClick={handleSave}
            >
              {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Robotics & Drives"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Scope of products included, specific engineering tolerances or standards..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
