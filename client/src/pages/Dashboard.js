import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Receipt, DollarSign, ChevronRight, TrendingUp } from 'lucide-react';
import { apiFetch } from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await apiFetch('/api/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-title" style={{ width: '200px' }} />
          <div className="skeleton skeleton-text" style={{ width: '300px' }} />
        </div>
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card" style={{ animation: 'none' }}>
              <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '60px', height: '32px' }} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="skeleton skeleton-title" style={{ width: '150px', marginBottom: '20px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '10px' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '10px' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h1>Dashboard</h1>
        <p>Overview of your pickleball activities</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stagger-1">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <Calendar size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Games</div>
            <div className="stat-value">{stats?.totalGames || 0}</div>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>Active season</span>
            </div>
          </div>
        </div>
        <div className="stat-card stagger-2">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <Users size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Players</div>
            <div className="stat-value">{stats?.totalPlayers || 0}</div>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>Growing community</span>
            </div>
          </div>
        </div>
        <div className="stat-card stagger-3">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Receipt size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">
              ${(stats?.totalExpenses || 0).toFixed(2)}
            </div>
            <div className="stat-trend">
              <DollarSign size={14} />
              <span>Tracked expenses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card stagger-4">
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={20} style={{ display: 'inline', marginRight: 8 }} />
            Upcoming Games
          </h3>
          <a href="/games" className="btn btn-secondary btn-sm">
            View All <ChevronRight size={16} />
          </a>
        </div>
        {stats?.upcomingGames?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingGames.map(game => (
                  <tr key={game.id}>
                    <td>{format(new Date(game.date), 'MMM d, yyyy')}</td>
                    <td>{game.time}</td>
                    <td>{game.location}</td>
                    <td>
                      <span className="badge badge-success">Scheduled</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No upcoming games</div>
            <p>Schedule a new game to get started</p>
          </div>
        )}
      </div>

      <div className="card stagger-5">
        <div className="card-header">
          <h3 className="card-title">
            <Receipt size={20} style={{ display: 'inline', marginRight: 8 }} />
            Recent Expenses
          </h3>
          <a href="/expenses" className="btn btn-secondary btn-sm">
            View All <ChevronRight size={16} />
          </a>
        </div>
        {stats?.recentExpenses?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentExpenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                    <td>
                      <span className="badge badge-neutral">{expense.category}</span>
                    </td>
                    <td>{expense.description}</td>
                    <td>${expense.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No expenses yet</div>
            <p>Add expenses to track shared costs</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
