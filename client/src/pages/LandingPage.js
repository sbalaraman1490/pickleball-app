import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

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

      {/* CTA Buttons */}
      <section className="cta-section">
        <button className="cta-button primary animate-bounce" onClick={() => navigate('/login')}>
          Member Login
        </button>
        <button className="cta-button secondary animate-pulse" onClick={() => navigate('/app')}>
          Explore App
        </button>
      </section>

      {/* Footer Links */}
      <footer className="landing-footer">
        <div className="footer-links">
          <a href="/app">Dashboard</a>
          <a href="/app/games">Scheduler</a>
          <a href="/app/expenses">Expenses</a>
          <a href="/app/players">Players</a>
        </div>
        <p className="footer-copyright">© 2024 Dinkans Pickleball Club</p>
      </footer>
    </div>
  );
}

export default LandingPage;
