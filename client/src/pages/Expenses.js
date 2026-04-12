import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, X, DollarSign, Check, Users } from 'lucide-react';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Court Fee',
    description: '',
    amount: 0,
    game_id: '',
    payer_id: '',
    split_among_all: true,
    splits: []
  });

  const categories = ['Court Fee', 'Equipment', 'Balls', 'Food & Drinks', 'Tournament', 'Other'];

  useEffect(() => {
    fetchExpenses();
    fetchPlayers();
    fetchGames();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const calculateSplits = () => {
    if (formData.split_among_all && players.length > 0) {
      const splitAmount = formData.amount / players.length;
      return players.map(p => ({
        player_id: p.id,
        amount: splitAmount,
        paid: false
      }));
    }
    return formData.splits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const splits = calculateSplits();
    const dataToSend = { ...formData, splits };
    
    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
    const method = editingExpense ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingExpense(null);
        resetForm();
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Court Fee',
      description: '',
      amount: 0,
      game_id: '',
      payer_id: '',
      split_among_all: true,
      splits: []
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      game_id: expense.game_id || '',
      payer_id: expense.payer_id || '',
      split_among_all: expense.split_among_all === 1,
      splits: expense.splits || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (response.ok) fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const toggleSplitPaid = async (expenseId, playerId, currentPaid) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, paid: !currentPaid })
      });
      if (response.ok) fetchExpenses();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const updateSplitAmount = (playerId, newAmount) => {
    const newSplits = formData.splits.map(s => 
      s.player_id === playerId ? { ...s, amount: parseFloat(newAmount) || 0 } : s
    );
    setFormData({ ...formData, splits: newSplits });
  };

  const openAddModal = () => {
    setEditingExpense(null);
    resetForm();
    setShowModal(true);
  };

  const getCategoryBadge = (category) => {
    const colors = {
      'Court Fee': 'badge-success',
      'Equipment': 'badge-warning',
      'Balls': 'badge-neutral',
      'Food & Drinks': 'badge-danger',
      'Tournament': 'badge-warning',
      'Other': 'badge-neutral'
    };
    return colors[category] || 'badge-neutral';
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <p>Track and split expenses with your group</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">${totalAmount.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Expenses</div>
          <div className="stat-value">{expenses.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Expenses</h3>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Expense
          </button>
        </div>

        {expenses.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid By</th>
                  <th>Split Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => {
                  const paidCount = expense.splits?.filter(s => s.paid).length || 0;
                  const totalCount = expense.splits?.length || 0;
                  
                  return (
                    <tr key={expense.id}>
                      <td>{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                      <td>
                        <span className={`badge ${getCategoryBadge(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td><strong>${expense.amount.toFixed(2)}</strong></td>
                      <td>{expense.payer_name || '-'}</td>
                      <td>
                        {totalCount > 0 ? (
                          <span className={paidCount === totalCount ? 'badge badge-success' : 'badge badge-warning'}>
                            {paidCount}/{totalCount} paid
                          </span>
                        ) : (
                          <span className="badge badge-neutral">Not split</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(expense)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => handleDelete(expense.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No expenses yet</div>
            <p>Add your first expense to start tracking costs</p>
          </div>
        )}
      </div>

      {/* Split Details Cards */}
      {expenses.filter(e => e.splits?.length > 0).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment Status</h3>
          </div>
          <div className="games-grid">
            {expenses.filter(e => e.splits?.length > 0).map(expense => (
              <div key={expense.id} className="game-card">
                <div className="game-card-header">
                  <div>
                    <div className="game-card-date">{expense.description || expense.category}</div>
                    <div className="game-card-time">${expense.amount.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {expense.splits.map(split => (
                    <div key={split.player_id} className="split-row" style={{ padding: '8px 0' }}>
                      <span className="split-player">{split.player_name}</span>
                      <span>${split.amount.toFixed(2)}</span>
                      <button
                        className={`btn btn-sm ${split.paid ? 'btn-success' : 'btn-secondary'}`}
                        style={{ 
                          background: split.paid ? '#c6f6d5' : '#edf2f7',
                          color: split.paid ? '#22543d' : '#4a5568'
                        }}
                        onClick={() => toggleSplitPaid(expense.id, split.player_id, split.paid)}
                      >
                        {split.paid ? <><Check size={14} /> Paid</> : 'Mark Paid'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="What was this expense for?"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Paid By</label>
                    <select
                      className="form-select"
                      value={formData.payer_id}
                      onChange={e => setFormData({...formData, payer_id: e.target.value})}
                    >
                      <option value="">-- Select --</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Related Game (Optional)</label>
                  <select
                    className="form-select"
                    value={formData.game_id}
                    onChange={e => setFormData({...formData, game_id: e.target.value})}
                  >
                    <option value="">-- None --</option>
                    {games.map(g => (
                      <option key={g.id} value={g.id}>
                        {format(new Date(g.date), 'MMM d')} - {g.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Split Method</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formData.split_among_all}
                        onChange={() => setFormData({...formData, split_among_all: true, splits: []})}
                      />
                      Split equally among all players
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={!formData.split_among_all}
                        onChange={() => setFormData({...formData, split_among_all: false, splits: players.map(p => ({ player_id: p.id, amount: 0, paid: false }))})}
                      />
                      Custom split
                    </label>
                  </div>
                </div>

                {!formData.split_among_all && (
                  <div className="form-group">
                    <label className="form-label">Custom Splits</label>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                      {players.map(player => {
                        const split = formData.splits.find(s => s.player_id === player.id);
                        return (
                          <div key={player.id} className="split-row">
                            <span className="split-player">{player.name}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input split-amount"
                              value={split?.amount || 0}
                              onChange={e => updateSplitAmount(player.id, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
