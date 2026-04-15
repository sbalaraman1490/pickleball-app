import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, ShoppingBag, LogIn, UserPlus, Home, Trophy } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './PublicLayout.css';

function PublicLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const publicLinks = [
    { path: '/rules', label: 'Rules & Guide', icon: BookOpen },
    { path: '/feed', label: 'Community Feed', icon: MessageSquare },
    { path: '/paddles', label: 'Paddle Compare', icon: ShoppingBag },
    { path: '/alta', label: 'ALTA Performance', icon: Trophy }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="public-layout">
      {/* Public Header */}
      <header className="public-header">
        <div className="public-header-content">
          <Link to="/" className="public-logo">
            <img src="/logo.jpeg" alt="Dinkans" className="public-logo-img" />
            <span className="logo-text">Dinkans</span>
          </Link>
          
          <nav className="public-nav">
            {publicLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`public-nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="public-auth">
            {user ? (
              <Link to="/app" className="btn btn-primary">
                Go to App
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  <LogIn size={18} />
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  <UserPlus size={18} />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-main">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="public-footer">
        <div className="public-footer-content">
          <div className="footer-brand">
            <img src="/logo.jpeg" alt="Dinkans" className="footer-logo-img" />
            <span>Dinkans</span>
          </div>
          <p className="footer-tagline">Elevating Play, Building Community</p>
          <div className="footer-links">
            <Link to="/rules">Rules</Link>
            <Link to="/feed">Feed</Link>
            <Link to="/paddles">Paddles</Link>
            <Link to="/alta">ALTA</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <p className="footer-copyright">© 2026 Dinkans. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
