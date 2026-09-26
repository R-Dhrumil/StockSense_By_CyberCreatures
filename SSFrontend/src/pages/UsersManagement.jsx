import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Mail,
  MapPin,
  Clock,
  Check,
  X,
  Edit2,
  Trash2,
  Send,
  Lock,
  Package,
  Truck,
  Eye
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

import { hasPermission } from '../utils/permissions';
import { userApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function UsersManagement({ onNotify, currentUser }) {
  const navigate = useNavigate();
  const canManageUsers = hasPermission.canManageUsers(currentUser?.role);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const ROLE_PERMISSIONS_MATRIX = [
    { module: 'Products & Catalog', admin: 'Full Control', manager: 'View & Edit', staff: 'View Only' },
    { module: 'Inventory & Stock', admin: 'Full Control', manager: 'Full Control', staff: 'View Only' },
    { module: 'Warehouses & Locations', admin: 'Full Control', manager: 'View & Edit', staff: 'View Only' },
    { module: 'Purchase Orders & Receipts', admin: 'Full Control', manager: 'Full Control', staff: 'Create Only' },
    { module: 'Sales Orders & Deliveries', admin: 'Full Control', manager: 'Full Control', staff: 'Create Only' },
    { module: 'Internal Transfers', admin: 'Full Control', manager: 'Full Control', staff: 'Request Only' },
    { module: 'Stock Adjustments', admin: 'Full Control', manager: 'Validate', staff: 'Request Only' },
    { module: 'Financial & Valuation Reports', admin: 'Full Control', manager: 'View & Export', staff: 'No Access' },
    { module: 'User Management', admin: 'Full Control', manager: 'No Access', staff: 'No Access' },
    { module: 'Suppliers & Vendors', admin: 'Full Control', manager: 'View & Edit', staff: 'View Only' },
  ];
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'permissions'
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'Warehouse Staff',
    department: 'Central Fulfillment',
    location: 'Oakland, CA'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getUsers();
      if (res?.data?.users && res.data.users.length > 0) {
        setUsers(res.data.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'ADMIN' ? 'Admin' : u.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Staff',
          department: u.department || 'Warehouse',
          status: u.isActive !== false ? 'Active' : 'Inactive',
          lastActive: 'Active recently',
          avatar: (u.name || 'US').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        })));
      }
    } catch (err) {
      console.warn('Backend users fallback to initial list:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '60px auto', padding: '40px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Shield size={28} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-neutral-600)', marginBottom: '24px', lineHeight: 1.5 }}>
          User provisioning, team role assignments, and permission matrices can only be managed by <strong>System Administrators</strong>.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ margin: '0 auto' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) return;

    try {
      const backendRole = inviteData.role.includes('Admin')
        ? 'ADMIN'
        : inviteData.role.includes('Inventory')
        ? 'INVENTORY_MANAGER'
        : 'STAFF';
      const tempPass = 'StockSense@' + Math.floor(1000 + Math.random() * 9000);
      await userApi.createUser({
        name: inviteData.name,
        email: inviteData.email,
        password: tempPass,
        role: backendRole,
        department: inviteData.department
      });
      fetchUsers();
      setIsInviteModalOpen(false);
      onNotify('User Enrolled', `Created ${inviteData.name} in DB. Temporary pass: ${tempPass}`, 'success');
    } catch (err) {
      alert(err.message || 'Failed to create user in database');
    }
  };

  const columns = [
    {
      header: 'Team Member',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="topbar-avatar" style={{ width: 34, height: 34, fontSize: '12px' }}>
            {row.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{row.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => <StatusBadge status={row.role} />
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-700)' }}>
          {row.department}
        </span>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)' }}>
          <MapPin size={12} style={{ color: 'var(--color-neutral-400)' }} />
          <span>{row.location}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Last Active',
      accessor: 'lastActive',
      render: (row) => (
        <span style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
          {row.lastActive}
        </span>
      )
    }
  ];

  return (
    <div className="users-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Administration</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Users & Access Control</span>
          </div>
          <h1 className="page-title">Team Directory & Permission Matrix</h1>
          <p className="page-subtitle">
            Manage authorized staff members, role-based access control (RBAC), and module privileges.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Plus size={16} />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          Staff Directory ({users.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          Role-Based Access Matrix (RBAC)
        </button>
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === 'directory' && (
        <DataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search team members by name, email, or role..."
        />
      )}

      {/* TAB 2: Permission Matrix */}
      {activeTab === 'permissions' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Granular Security Privilege Matrix</h3>
              <p className="card-subtitle">
                Defined access tiers for Admin, Inventory Manager, and Warehouse Staff
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success">Enforced at API Gateway</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="permission-matrix">
              <thead>
                <tr>
                  <th style={{ width: '320px' }}>System Action / Module</th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={14} style={{ color: 'var(--color-primary-500)' }} /> Admin
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} style={{ color: 'var(--color-warning-500)' }} /> Inventory Manager
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={14} style={{ color: 'var(--color-success-500)' }} /> Warehouse Staff
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROLE_PERMISSIONS_MATRIX.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={14} style={{ color: 'var(--color-primary-600)' }} />
                        <span style={{ fontWeight: 500 }}>{row.module}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{row.admin}</span>
                    </td>
                    <td>
                      <span className={`badge ${row.manager === 'No Access' ? 'badge-neutral' : 'badge-info'}`}>
                        {row.manager}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.staff === 'No Access' ? 'badge-neutral' : (row.staff.includes('Only') ? 'badge-warning' : 'badge-success')}`}>
                        {row.staff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Enterprise User"
        subtitle="Sends an encrypted 24-hour onboarding link"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendInvite}
            >
              <Send size={15} />
              <span>Send Invitation</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSendInvite}>
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Maya Lin"
              value={inviteData.name}
              onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Email <span className="required">*</span></label>
            <input
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role Privilege Tier</label>
              <select
                className="form-select"
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              >
                <option value="Admin">Admin (System Owner / Settings)</option>
                <option value="Inventory Manager">Inventory Manager (Stock Operations)</option>
                <option value="Warehouse Staff">Warehouse Staff (Transfers & Counting)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. West Coast Fulfillment"
                value={inviteData.department}
                onChange={(e) => setInviteData({ ...inviteData, department: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
