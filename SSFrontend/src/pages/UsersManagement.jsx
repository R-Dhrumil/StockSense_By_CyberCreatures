import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { INITIAL_USERS, ROLE_PERMISSIONS_MATRIX } from '../data/mockData';

export default function UsersManagement({ onNotify }) {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'permissions'
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'Warehouse Staff',
    department: 'Central Fulfillment',
    location: 'Oakland, CA'
  });

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) return;

    const initials = inviteData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser = {
      id: `USR-0${users.length + 1}`,
      ...inviteData,
      status: 'Pending',
      lastActive: 'Invitation Sent',
      avatar: initials || 'US'
    };

    setUsers([...users, newUser]);
    setIsInviteModalOpen(false);
    onNotify('Invitation Dispatched', `Sent activation link to ${newUser.email} with ${newUser.role} privileges.`, 'success');
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
                Defined access tiers for Admin, Inventory Manager, Warehouse Staff, and Viewer profiles
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
                  <th style={{ width: '280px' }}>System Module</th>
                  <th>👑 Admin</th>
                  <th>📦 Inventory Manager</th>
                  <th>🚚 Warehouse Staff</th>
                  <th>👁️ Viewer</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_PERMISSIONS_MATRIX.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={14} style={{ color: 'var(--color-primary-600)' }} />
                        <span>{row.module}</span>
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
                      <span className={`badge ${row.staff === 'No Access' ? 'badge-neutral' : (row.staff.includes('Only') ? 'badge-warning' : 'badge-info')}`}>
                        {row.staff}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.viewer === 'No Access' ? 'badge-neutral' : 'badge-neutral'}`}>
                        {row.viewer}
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
                <option value="Admin">Admin (Full Control)</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Warehouse Staff">Warehouse Staff</option>
                <option value="Viewer">Viewer (Read-only)</option>
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
