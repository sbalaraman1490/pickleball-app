import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, MessageSquare, ShoppingBag, ArrowRight, Play } from 'lucide-react';
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
                  <div style={{color:'#3897f0', fontFamily:'Arial,sans-serif', fontSize:'14px', fontStyle:'normal', fontWeight:'550', lineHeight:'18px'}}>View this profile on Instagram</div>
                </div>
                <div style={{padding:'12.5% 0'}}></div>
                <div style={{display:'flex', flexDirection:'row', marginBottom:'14px', alignItems:'center'}}>
                  <div>
                    <div style={{backgroundColor:'#F4F4F4', borderRadius:'50%', height:'12.5px', width:'12.5px', transform:'translateX(0px) translateY(7px)'}}></div>
                    <div style={{backgroundColor:'#F4F4F4', height:'12.5px', transform:'rotate(-45deg) translateX(3px) translateY(1px)', width:'12.5px', flexGrow:0, marginRight:'14px', marginLeft:'2px'}}></div>
                    <div style={{backgroundColor:'#F4F4F4', borderRadius:'50%', height:'12.5px', width:'12.5px', transform:'translateX(9px) translateY(-18px)'}}></div>
                  </div>
                  <div style={{marginLeft:'8px'}}>
                    <div style={{backgroundColor:'#F4F4F4', borderRadius:'50%', flexGrow:0, height:'20px', width:'20px'}}></div>
                    <div style={{width:0, height:0, borderTop:'2px solid transparent', borderLeft:'6px solid #f4f4f4', borderBottom:'2px solid transparent', transform:'translateX(16px) translateY(-4px) rotate(30deg)'}}></div>
                  </div>
                  <div style={{marginLeft:'auto'}}>
                    <div style={{width:'0px', borderTop:'8px solid #F4F4F4', borderRight:'8px solid transparent', transform:'translateY(16px)'}}></div>
                    <div style={{backgroundColor:'#F4F4F4', flexGrow:0, height:'12px', width:'16px', transform:'translateY(-4px)'}}></div>
                    <div style={{width:0, height:0, borderTop:'8px solid #F4F4F4', borderLeft:'8px solid transparent', transform:'translateY(-4px) translateX(8px)'}}></div>
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', flexGrow:1, justifyContent:'center', marginBottom:'24px'}}>
                  <div style={{backgroundColor:'#F4F4F4', borderRadius:'4px', flexGrow:0, height:'14px', marginBottom:'6px', width:'224px'}}></div>
                  <div style={{backgroundColor:'#F4F4F4', borderRadius:'4px', flexGrow:0, height:'14px', width:'144px'}}></div>
                </div>
              </a>
              <p style={{color:'#c9c8cd', fontFamily:'Arial,sans-serif', fontSize:'14px', lineHeight:'17px', marginBottom:0, marginTop:'8px', overflow:'hidden', padding:'8px 0 7px', textAlign:'center', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                <a href="https://www.instagram.com/dinkanspb007/?utm_source=ig_embed&amp;utm_campaign=loading" style={{color:'#c9c8cd', fontFamily:'Arial,sans-serif', fontSize:'14px', fontStyle:'normal', fontWeight:'normal', lineHeight:'17px'}} target="_blank" rel="noreferrer">Dinkans</a> (@<a href="https://www.instagram.com/dinkanspb007/?utm_source=ig_embed&amp;utm_campaign=loading" style={{color:'#c9c8cd', fontFamily:'Arial,sans-serif', fontSize:'14px', fontStyle:'normal', fontWeight:'normal', lineHeight:'17px'}} target="_blank" rel="noreferrer">dinkanspb007</a>) • Instagram photos and videos
              </p>
            </div>
          </blockquote>
        </div>
        <script async src="//www.instagram.com/embed.js"></script>
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

      {/* Footer Links */}
      <footer className="landing-footer">
        <div className="footer-links">
          <Link to="/rules">Rules</Link>
          <Link to="/feed">Feed</Link>
          <Link to="/paddles">Paddles</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
        <p className="footer-copyright">© 2026 Dinkans Pickleball Club</p>
      </footer>
    </div>
  );
}

export default LandingPage;
