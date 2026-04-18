import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Receipt, Check, X, Shield, User, Plus, Image as ImageIcon, LayoutDashboard } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    approved: true
  });

  useEffect(() => {
    fetchUsers();
    fetchPendingExpenses();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/api/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingExpenses = async () => {
    try {
      const data = await apiFetch('/api/admin/expenses/pending');
      setPendingExpenses(data);
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    }
  };

  const approveUser = async (userId) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/approve`, { method: 'PUT' });
      setMessage('User approved successfully');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error approving user: ' + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('User deleted successfully');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting user: ' + error.message);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      setMessage(`User role updated to ${newRole}`);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error changing role: ' + error.message);
    }
  };

  const approveExpense = async (expenseId) => {
    try {
      await apiFetch(`/api/admin/expenses/${expenseId}/approve`, { method: 'PUT' });
      setMessage('Expense approved successfully');
      fetchPendingExpenses();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error approving expense: ' + error.message);
    }
  };

  const rejectExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to reject this expense?')) return;
    try {
      await apiFetch(`/api/admin/expenses/${expenseId}/reject`, { method: 'PUT' });
      setMessage('Expense rejected');
      fetchPendingExpenses();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error rejecting expense: ' + error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (newUser.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      setMessage(`User ${newUser.name} created successfully`);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', approved: true });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating user: ' + error.message);
    }
  };

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage users and approve expenses</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/app/menu-builder')}
          >
            <LayoutDashboard size={18} /> Menu Builder
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin-gallery')}
          >
            <ImageIcon size={18} /> Manage Gallery
          </button>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users ({pendingUsers.length} pending)
        </button>
        <button 
          className={`admin-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={18} />
          Expenses ({pendingExpenses.length} pending)
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-section">
          {/* Create User Button */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">
                <Plus size={20} />
                Create New User
              </h3>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} /> Create User
              </button>
            </div>
          </div>

          {/* Pending Users */}
          {pendingUsers.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-card-title pending">
                <User size={20} />
                Pending Approval ({pendingUsers.length})
              </h3>
              <div className="admin-list">
                {pendingUsers.map(user => (
                  <div key={user.id} className="admin-item pending">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{user.name}</div>
                      <div className="admin-item-email">{user.email}</div>
                      <div className="admin-item-date">Registered: {new Date(user.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="admin-item-actions">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => approveUser(user.id)}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(user.id)}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Users */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <Shield size={20} />
              Approved Users ({approvedUsers.length})
            </h3>
            <div className="admin-list">
              {approvedUsers.map(user => (
                <div key={user.id} className="admin-item">
                  <div className="admin-item-info">
                    <div className="admin-item-name">
                      {user.name}
                      {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                    </div>
                    <div className="admin-item-email">{user.email}</div>
                  </div>
                  <div className="admin-item-actions">
                    <select 
                      className="role-select"
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteUser(user.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="admin-section">
          {pendingExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✓</div>
              <div className="empty-state-title">No pending expenses</div>
              <p>All expenses have been reviewed</p>
            </div>
          ) : (
            <div className="admin-card">
              <h3 className="admin-card-title pending">
                <Receipt size={20} />
                Pending Expenses ({pendingExpenses.length})
              </h3>
              <div className="admin-list">
                {pendingExpenses.map(expense => (
                  <div key={expense.id} className="admin-item expense-item">
                    <div className="admin-item-info">
                      <div className="admin-item-name">
                        {expense.category}: ${expense.amount?.toFixed(2)}
                      </div>
                      <div className="admin-item-details">
                        {expense.description}
                        {expense.game_location && ` • ${expense.game_location}`}
                      </div>
                      <div className="admin-item-meta">
                        Created by: {expense.creator_name || 'Unknown'} • 
                        Date: {new Date(expense.date).toLocaleDateString()}
                      </div>
                      {expense.splits?.length > 0 && (
                        <div className="expense-splits">
                          Split among: {expense.splits.map(s => `${s.player_name} ($${s.amount?.toFixed(2)})`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="admin-item-actions">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => approveExpense(expense.id)}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectExpense(expense.id)}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New User</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password * (min 6 chars)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Create password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newUser.approved}
                      onChange={e => setNewUser({...newUser, approved: e.target.value === 'true'})}
                    >
                      <option value={true}>Approved</option>
                      <option value={false}>Pending Approval</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
