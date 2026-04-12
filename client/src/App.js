import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Receipt, Scale } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Players from './pages/Players';
import Expenses from './pages/Expenses';
import Balances from './pages/Balances';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <img src="/logo.png" alt="Dinkans" className="logo-img" />
            </div>
          </div>
          
          <ul className="nav-menu">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/games" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Calendar size={20} />
                <span>Games</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/players" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Users size={20} />
                <span>Players</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/expenses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Receipt size={20} />
                <span>Expenses</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/balances" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Scale size={20} />
                <span>Balances</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/games" element={<Games />} />
            <Route path="/players" element={<Players />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/balances" element={<Balances />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
