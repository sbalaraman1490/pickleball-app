import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, MessageSquare, ShoppingBag, ArrowRight, Play, Trophy, Bot, Image as ImageIcon, LayoutDashboard, Settings, FileText, Calendar, Users, BarChart3, Database, Globe, Mail, Folder, Star, Heart } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './LandingPage.css';

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

function LandingPage() {
  const navigate = useNavigate();
  const [publicMenuItems, setPublicMenuItems] = useState([]);

  useEffect(() => {
    const fetchPublicMenuItems = async () => {
      try {
        const data = await apiFetch('/api/public/menu-items');
        setPublicMenuItems(data.items || []);
      } catch (error) {
        console.error('Error fetching public menu items:', error);
      }
    };
    fetchPublicMenuItems();
  }, []);

  const renderIcon = (iconName) => {
    const Icon = iconMap[iconName] || FileText;
    return <Icon size={18} />;
  };

  return (
    <div className="landing-page">
      {/* Hero Section with Logo */}
      <section className="hero-section">
        <div className="hero-logo">
          <img src="/logo.jpeg" alt="Dinkans" className="landing-logo" />
        </div>
        <h1 className="hero-title">
          <span className="animate-fade-in">Elevating Play,</span>
          <span className="animate-fade-in delay-1">Building Community</span>
        </h1>
      </section>

      {/* Top Navigation Menu */}
      <nav className="top-navigation">
        <div className="nav-links">
          <Link to="/rules" className="nav-link">
            <BookOpen size={18} />
            <span>Rules</span>
          </Link>
          <Link to="/feed" className="nav-link">
            <MessageSquare size={18} />
            <span>Feed</span>
          </Link>
          <Link to="/paddles" className="nav-link">
            <ShoppingBag size={18} />
            <span>Paddles</span>
          </Link>
          <Link to="/dupr" className="nav-link">
            <span>DUPR Lookup</span>
          </Link>
          <Link to="/alta" className="nav-link">
            <Trophy size={18} />
            <span>ALTA</span>
          </Link>
          <Link to="/chat" className="nav-link">
            <Bot size={18} />
            <span>AI Chat</span>
          </Link>
          <Link to="/gallery" className="nav-link">
            <ImageIcon size={18} />
            <span>Gallery</span>
          </Link>
          {publicMenuItems.map(item => (
            <Link key={item.id} to={`/${item.route}`} className="nav-link">
              {renderIcon(item.icon)}
              <span>{item.title}</span>
            </Link>
          ))}
          <Link to="/login" className="nav-link login-link">
            <span>Login</span>
          </Link>
          <Link to="/signup" className="nav-link signup-link">
            <span>Sign Up</span>
          </Link>
        </div>
      </nav>

      {/* Goals & Support Section */}
      <section className="content-section">
        <div className="content-grid">
          {/* Our Goals */}
          <div className="content-card animate-slide-left">
            <div className="card-header-with-icon">
              <span className="card-icon">📈</span>
              <h2>Our Goals</h2>
            </div>
            <ul className="goals-list">
              <li className="animate-item">Build a strong, respectful community where <strong>every player belongs</strong></li>
              <li className="animate-item">Create a <strong>positive, pressure-free space</strong> to unwind and recharge through play</li>
              <li className="animate-item">Foster lasting friendship, collaboration, and mutual support — <strong>no egos, no hierarchies</strong></li>
              <li className="animate-item">Host tournaments that <strong>offer true value</strong> for every participant's contribution</li>
              <li className="animate-item"><strong>Promote wellness and fitness</strong> through community-driven play</li>
            </ul>
          </div>

          {/* Why Support Us */}
          <div className="content-card animate-slide-right">
            <div className="card-header-with-icon">
              <span className="card-icon">💝</span>
              <h2>Why Support Us</h2>
            </div>
            <ul className="support-list">
              <li className="animate-item"><strong>100% non-profit</strong> — every contribution fuels community programs and events</li>
              <li className="animate-item"><strong>Strengthen your brand</strong> by promoting wellness and social connection</li>
              <li className="animate-item"><strong>Gain authentic visibility</strong> through local tournaments and outreach</li>
              <li className="animate-item"><strong>Showcase your commitment</strong> to health, inclusion, and active living</li>
              <li className="animate-item"><strong>Partner transparently</strong> — every dollar drives fair play and engagement</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Join Journey Section */}
      <section className="journey-section animate-fade-up">
        <div className="journey-content">
          <span className="rocket-icon">🚀</span>
          <h2>Join Our Journey</h2>
          <p>Help us make pickleball more than a sport — a movement that inspires health, unity, and joy.</p>
        </div>
      </section>

      {/* Quote Section */}
      <section className="quote-section animate-fade-in">
        <blockquote>
          "A community-driven, non-profit initiative bringing people together through pickleball to stay active, connected, and uplifted — on and off the court."
        </blockquote>
      </section>

      {/* Instagram Section */}
      <section className="instagram-section animate-fade-up">
        <h2>Follow Us on Instagram</h2>
        <p className="instagram-subtitle">@dinkanspb007</p>
        <a 
          href="https://www.instagram.com/dinkanspb007/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="instagram-link"
        >
          <MessageSquare size={20} />
          Follow Us on Instagram
        </a>
      </section>

      {/* Public Features Section */}
      <section className="features-section">
        <h2 className="features-title">Free Resources</h2>
        <p className="features-subtitle">No login required — explore our community resources</p>
        <div className="features-grid">
          <Link to="/rules" className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <BookOpen size={32} color="white" />
            </div>
            <h3>Rules & Guide</h3>
            <p>Learn pickleball basics, scoring, serving rules, kitchen etiquette, and more.</p>
            <span className="feature-link">Learn the rules <ArrowRight size={16} /></span>
          </Link>
          
          <Link to="/feed" className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <MessageSquare size={32} color="white" />
            </div>
            <h3>Community Feed</h3>
            <p>Latest news, tips, tournament updates, and community discussions.</p>
            <span className="feature-link">Browse feed <ArrowRight size={16} /></span>
          </Link>
          
          <Link to="/paddles" className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <ShoppingBag size={32} color="white" />
            </div>
            <h3>Paddle Compare</h3>
            <p>Compare paddles, prices, ratings, and find the best deals.</p>
            <span className="feature-link">Compare paddles <ArrowRight size={16} /></span>
          </Link>
        </div>
      </section>

      {/* Pickleball Drills Section */}
      <section className="drills-section">
        <div className="container">
          <div className="section-header">
            <Play className="section-icon" />
            <h2>Pickleball Drills</h2>
            <p>Improve your game with professional drills and tutorials from top coaches</p>
          </div>
          <div className="drills-cta">
            <a 
              href="https://www.youtube.com/results?search_query=pickleball+drills+for+beginners" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="drills-button"
            >
              <Play size={24} />
              Watch Pickleball Drills on YouTube
            </a>
            <p className="drills-note">Learn dinking, third shot drops, volleys, footwork, serves, and more from professional instructors</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <button className="cta-button primary animate-bounce" onClick={() => navigate('/login')}>
          Member Login
        </button>
        <button className="cta-button secondary animate-pulse" onClick={() => navigate('/signup')}>
          Join Free
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="footer-copyright">© 2026 Dinkans Pickleball Club</p>
      </footer>
    </div>
  );
}

export default LandingPage;
