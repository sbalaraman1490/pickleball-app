import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AppLayout from './AppLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected App Routes */}
          <Route path="/app/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        
        {/* Redirect old routes to /app */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="/games" element={<Navigate to="/app/games" replace />} />
        <Route path="/players" element={<Navigate to="/app/players" replace />} />
        <Route path="/expenses" element={<Navigate to="/app/expenses" replace />} />
        <Route path="/balances" element={<Navigate to="/app/balances" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
