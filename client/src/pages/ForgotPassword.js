import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check, Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(true);

  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (recaptchaSiteKey && !captchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          captchaToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'If an account exists with this email, you will receive password reset instructions.');
        setShowCaptcha(false);
      } else {
        setError(data.error || 'Failed to send reset email');
        // Reset captcha on error
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
        setCaptchaToken('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
            <h1>Reset Password</h1>
            <p>Enter your email to receive reset instructions</p>
          </div>

          {message && (
            <div className="login-success">
              <Check size={20} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="login-error">
              <span>{error}</span>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              {showCaptcha && recaptchaSiteKey && (
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
