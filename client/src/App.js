import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AppLayout from './AppLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* App Routes with Sidebar */}
        <Route path="/app/*" element={<AppLayout />} />
        
        {/* Redirect old routes to /app */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="/games" element={<Navigate to="/app/games" replace />} />
        <Route path="/players" element={<Navigate to="/app/players" replace />} />
        <Route path="/expenses" element={<Navigate to="/app/expenses" replace />} />
        <Route path="/balances" element={<Navigate to="/app/balances" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
