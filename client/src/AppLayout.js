import React from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Receipt, Scale, LogOut, Shield, User, BookOpen, MessageSquare, ShoppingBag } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Players from './pages/Players';
import Expenses from './pages/Expenses';
import Balances from './pages/Balances';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Rules from './pages/Rules';
import Feed from './pages/Feed';
import PaddleCompare from './pages/PaddleCompare';
import './App.css';

function AppLayout() {
  const { logout, isAdmin, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="app">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-spacer"></div>
        <div className="header-user">
          <Link to="/app/profile" className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              {user?.role === 'admin' && <span className="user-role">Admin</span>}
            </div>
          </Link>
          <button className="logout-btn-header" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logo.jpeg" alt="Dinkans" className="logo-img" />
          </div>
        </div>
        
        <ul className="nav-menu">
          <li>
            <NavLink to="/app" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/games" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Calendar size={20} />
              <span>Scheduler</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/players" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Users size={20} />
              <span>Players</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/expenses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Receipt size={20} />
              <span>Expenses</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/balances" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Scale size={20} />
              <span>Balances</span>
            </NavLink>
          </li>
          <li className="nav-divider"></li>
          <li>
            <NavLink to="/app/rules" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <BookOpen size={20} />
              <span>Rules & Guide</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/feed" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <MessageSquare size={20} />
              <span>Community Feed</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/paddles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <ShoppingBag size={20} />
              <span>Paddle Compare</span>
            </NavLink>
          </li>
          <li className="nav-divider"></li>
          <li>
            <NavLink to="/app/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <User size={20} />
              <span>My Profile</span>
            </NavLink>
          </li>
          {isAdmin() && (
            <li>
              <NavLink to="/app/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Shield size={20} />
                <span>Admin</span>
              </NavLink>
            </li>
          )}
        </ul>

        <div className="sidebar-footer">
          <a href="/" className="back-to-home">← Back to Home</a>
        </div>
      </nav>

      <main className="main-content">
        <div className="page-content animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/games" element={<Games />} />
            <Route path="/players" element={<Players />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/balances" element={<Balances />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/paddles" element={<PaddleCompare />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
