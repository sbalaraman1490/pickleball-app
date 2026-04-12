import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skill_level: 'Beginner'
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingPlayer ? `/api/players/${editingPlayer.id}` : '/api/players';
    const method = editingPlayer ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingPlayer(null);
        setFormData({ name: '', email: '', phone: '', skill_level: 'Beginner' });
        fetchPlayers();
      }
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData(player);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const response = await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (response.ok) fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const openAddModal = () => {
    setEditingPlayer(null);
    setFormData({ name: '', email: '', phone: '', skill_level: 'Beginner' });
    setShowModal(true);
  };

  const getSkillBadge = (level) => {
    const colors = {
      'Beginner': 'badge-neutral',
      'Intermediate': 'badge-warning',
      'Advanced': 'badge-success'
    };
    return colors[level] || 'badge-neutral';
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Players</h1>
        <p>Manage your pickleball players</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Players</h3>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Player
          </button>
        </div>

        {players.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Skill Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td><strong>{player.name}</strong></td>
                    <td>{player.email || '-'}</td>
                    <td>{player.phone || '-'}</td>
                    <td>
                      <span className={`badge ${getSkillBadge(player.skill_level)}`}>
                        {player.skill_level}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(player)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => handleDelete(player.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No players yet</div>
            <p>Add players to start organizing games</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPlayer ? 'Edit Player' : 'Add Player'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Skill Level</label>
                  <select
                    className="form-select"
                    value={formData.skill_level}
                    onChange={e => setFormData({...formData, skill_level: e.target.value})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlayer ? 'Save Changes' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Players;
