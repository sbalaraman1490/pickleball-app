import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (recaptchaSiteKey && !captchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register(name, email, password, captchaToken);
      
      if (result.approved) {
        // First user (admin) is auto-approved
        navigate('/app');
      } else {
        // Show pending approval message
        setSuccess('Registration successful! Please wait for admin approval before logging in.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.message);
      // Reset captcha on error
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logo.jpeg" alt="Dinkans" className="auth-logo-img" />
            </div>
            <h1>Create Account</h1>
            <p>Join the Dinkans pickleball community</p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <User size={18} />
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={18} />
                Password
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 chars)"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={18} />
                Confirm Password
              </label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            {recaptchaSiteKey && (
              <div className="captcha-container">
                <ReCAPTCHA
                  sitekey={recaptchaSiteKey}
                  onChange={handleCaptchaChange}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading || (recaptchaSiteKey && !captchaToken)}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          )}

          {!success && (
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
            <Link to="/" className="back-link">← Back to Home</Link>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignUp;
