import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simple demo login - in production, verify against backend
    if (email && password) {
      // Store login state
      localStorage.setItem('dinkans_logged_in', 'true');
      localStorage.setItem('dinkans_user', email);
      
      // Redirect to expenses page
      navigate('/app/expenses');
    } else {
      setError('Please enter both email and password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo.jpeg" alt="Dinkans" className="login-logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to access your expense sheet</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>

          <div className="login-footer">
            <a href="/" className="back-link">← Back to Home</a>
            <p className="demo-note">
              Demo: Any email/password works
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
