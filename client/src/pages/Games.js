import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, X, MapPin, DollarSign, Check } from 'lucide-react';

function Games() {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    court_fee: 0,
    notes: '',
    player_ids: []
  });

  useEffect(() => {
    fetchGames();
    fetchPlayers();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingGame ? `/api/games/${editingGame.id}` : '/api/games';
    const method = editingGame ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingGame(null);
        setFormData({ date: '', time: '', location: '', court_fee: 0, notes: '', player_ids: [] });
        fetchGames();
      }
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    setFormData({
      date: game.date,
      time: game.time,
      location: game.location,
      court_fee: game.court_fee || 0,
      notes: game.notes || '',
      player_ids: game.players?.map(p => p.player_id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      const response = await fetch(`/api/games/${id}`, { method: 'DELETE' });
      if (response.ok) fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const togglePlayerPayment = async (gameId, playerId, currentPaid) => {
    try {
      const response = await fetch(`/api/games/${gameId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, paid: !currentPaid })
      });
      if (response.ok) fetchGames();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const openAddModal = () => {
    setEditingGame(null);
    setFormData({ date: '', time: '', location: '', court_fee: 0, notes: '', player_ids: [] });
    setShowModal(true);
  };

  const togglePlayerSelection = (playerId) => {
    const newIds = formData.player_ids.includes(playerId)
      ? formData.player_ids.filter(id => id !== playerId)
      : [...formData.player_ids, playerId];
    setFormData({ ...formData, player_ids: newIds });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': 'badge-success',
      'completed': 'badge-neutral',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-neutral';
  };

  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedTab === 'upcoming') {
      return gameDate >= today && game.status !== 'cancelled';
    } else if (selectedTab === 'past') {
      return gameDate < today || game.status === 'completed';
    }
    return true;
  });

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Games</h1>
        <p>Schedule and manage your pickleball games</p>
      </div>

      <div className="section-tabs">
        <button 
          className={`section-tab ${selectedTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`section-tab ${selectedTab === 'past' ? 'active' : ''}`}
          onClick={() => setSelectedTab('past')}
        >
          Past Games
        </button>
        <button 
          className={`section-tab ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          All Games
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{selectedTab === 'upcoming' ? 'Upcoming Games' : selectedTab === 'past' ? 'Past Games' : 'All Games'}</h3>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Schedule Game
          </button>
        </div>

        {filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map(game => (
              <div key={game.id} className="game-card">
                <div className="game-card-header">
                  <div>
                    <div className="game-card-date">
                      {format(new Date(game.date), 'EEEE, MMM d, yyyy')}
                    </div>
                    <div className="game-card-time">{game.time}</div>
                  </div>
                  <span className={`badge ${getStatusBadge(game.status)}`}>
                    {game.status}
                  </span>
                </div>

                <div className="game-card-location">
                  <MapPin size={16} />
                  {game.location}
                </div>

                {game.players?.length > 0 && (
                  <div className="game-card-players">
                    {game.players.map(p => (
                      <span 
                        key={p.player_id} 
                        className={`game-player-tag ${p.paid ? 'paid' : ''}`}
                        title={p.paid ? 'Paid' : 'Not paid - Click to toggle'}
                        onClick={() => togglePlayerPayment(game.id, p.player_id, p.paid)}
                        style={{ cursor: 'pointer' }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="game-card-footer">
                  <div className="game-card-fee">
                    <DollarSign size={14} style={{ display: 'inline' }} />
                    Court Fee: <strong>${(game.court_fee || 0).toFixed(2)}</strong>
                  </div>
                  <div className="game-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(game)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏸</div>
            <div className="empty-state-title">No games found</div>
            <p>Schedule your first game to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingGame ? 'Edit Game' : 'Schedule Game'}</h3>
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
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Central Park Court 3"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Court Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.court_fee}
                      onChange={e => setFormData({...formData, court_fee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  {editingGame && (
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status || 'scheduled'}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Players</label>
                  {players.length > 0 ? (
                    <div className="player-checkbox-list">
                      {players.map(player => (
                        <label key={player.id} className="player-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.player_ids.includes(player.id)}
                            onChange={() => togglePlayerSelection(player.id)}
                          />
                          {player.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="form-text" style={{ color: '#718096' }}>
                      No players available. <a href="/players">Add players first</a>.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGame ? 'Save Changes' : 'Schedule Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Games;
