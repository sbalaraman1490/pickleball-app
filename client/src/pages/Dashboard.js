import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Receipt, DollarSign, ChevronRight } from 'lucide-react';
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

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your pickleball activities</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Games</div>
          <div className="stat-value">{stats?.totalGames || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Players</div>
          <div className="stat-value">{stats?.totalPlayers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">
            ${(stats?.totalExpenses || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
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

      <div className="card">
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
