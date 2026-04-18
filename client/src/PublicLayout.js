import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, ShoppingBag, LogIn, UserPlus, Home, Trophy, Bot, Image as ImageIcon, LayoutDashboard, Settings, FileText, Calendar, Users, BarChart3, Database, Globe, Mail, Folder, Star, Heart } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { apiFetch } from './utils/api';
import './PublicLayout.css';

// Icon mapping for dynamic menu items
const iconMap = {
  LayoutDashboard,
  Settings,
  FileText,
  Calendar,
  Users,
  Chart: BarChart3,
  Database,
  Globe,
  Mail,
  Folder,
  Star,
  Heart,
  BookOpen,
  MessageSquare,
  ShoppingBag,
  Trophy,
  Bot,
  ImageIcon
};

function PublicLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [publicMenuItems, setPublicMenuItems] = useState([]);

  useEffect(() => {
    const fetchPublicMenuItems = async () => {
      try {
        const data = await apiFetch('/api/public/menu-items');
        console.log('Public menu items fetched:', data);
        setPublicMenuItems(data.items || []);
      } catch (error) {
        console.error('Error fetching public menu items:', error);
      }
    };
    fetchPublicMenuItems();
  }, []);

  const publicLinks = [
    { path: '/rules', label: 'Rules & Guide', icon: BookOpen },
    { path: '/feed', label: 'Community Feed', icon: MessageSquare },
    { path: '/paddles', label: 'Paddle Compare', icon: ShoppingBag },
    { path: '/alta', label: 'ALTA Performance', icon: Trophy },
    { path: '/chat', label: 'AI Chat', icon: Bot },
    { path: '/gallery', label: 'Gallery', icon: ImageIcon }
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
            {publicMenuItems.map(item => {
              const MenuIcon = iconMap[item.icon] || FileText;
              return (
                <Link
                  key={item.id}
                  to={`/${item.route}`}
                  className={`public-nav-link ${isActive(`/${item.route}`) ? 'active' : ''}`}
                >
                  <MenuIcon size={18} />
                  {item.title}
                </Link>
              );
            })}
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
            <Link to="/gallery">Gallery</Link>
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
