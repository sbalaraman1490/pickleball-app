import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Star, DollarSign, Check, X, ExternalLink, Filter, ChevronDown, ChevronUp, Info, RefreshCw, Globe, Database, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './PaddleCompare.css';

function PaddleCompare() {
  const [paddles, setPaddles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('fallback');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [selectedPaddles, setSelectedPaddles] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 300]);
  
  const { isAdmin, user } = useAuth();
  const isLoggedIn = !!user;
  const PUBLIC_PADDLE_LIMIT = 4;

  // Fetch paddles from API
  const fetchPaddles = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/paddles');
      if (!response.ok) throw new Error('Failed to fetch paddles');
      
      const data = await response.json();
      setPaddles(data.paddles || []);
      setSource(data.source || 'fallback');
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error('Error fetching paddles:', err);
      setError('Failed to load paddle data. Using cached data.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh paddle data (admin only)
  const refreshPaddles = async () => {
    if (!isAdmin()) return;
    
    setRefreshing(true);
    try {
      const response = await fetch('/api/paddles/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to refresh');
      
      await fetchPaddles(false);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaddles();
  }, []);

  const categories = [
    { id: 'all', label: 'All Paddles' },
    { id: 'control', label: 'Control' },
    { id: 'power', label: 'Power' },
    { id: 'balanced', label: 'Balanced' },
    { id: 'spin', label: 'Spin' },
    { id: 'budget', label: 'Budget' }
  ];

  const filteredPaddles = useMemo(() => {
    let result = [...paddles];

    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }

    // Limit to 4 paddles for non-logged-in users
    if (!isLoggedIn && result.length > PUBLIC_PADDLE_LIMIT) {
      result = result.slice(0, PUBLIC_PADDLE_LIMIT);
    }

    return result;
  }, [paddles, filterCategory, priceRange, sortBy, isLoggedIn]);

  const togglePaddleSelection = (paddle) => {
    if (selectedPaddles.find(p => p.id === paddle.id)) {
      setSelectedPaddles(selectedPaddles.filter(p => p.id !== paddle.id));
    } else if (selectedPaddles.length < 3) {
      setSelectedPaddles([...selectedPaddles, paddle]);
    }
  };

  const clearComparison = () => {
    setSelectedPaddles([]);
  };

  const getCategoryColor = (category) => {
    const colors = {
      control: '#3b82f6',
      power: '#ef4444',
      balanced: '#10b981',
      spin: '#f59e0b',
      budget: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Paddle Comparison</h1>
          <p>Loading paddle data from external sources...</p>
        </div>
        <div className="paddles-loading">
          <div className="spin"></div>
          <p>Fetching latest paddle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-with-actions">
          <div>
            <h1>Paddle Comparison</h1>
            <p>Compare pickleball paddles with real-time pricing from multiple sources</p>
          </div>
          <div className="header-actions">
            {isAdmin() && (
              <button 
                className="btn btn-secondary"
                onClick={refreshPaddles}
                disabled={refreshing}
              >
                <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            )}
            <div className="data-source-badge">
              {source === 'external' ? (
                <><Globe size={14} /> Live Data</>
              ) : (
                <><Database size={14} /> Cached Data</>
              )}
            </div>
          </div>
        </div>
        {lastUpdated && (
          <p className="last-updated">Last updated: {formatDate(lastUpdated)}</p>
        )}
      </div>

      {/* Limited Access Banner for non-logged-in users */}
      {!isLoggedIn && (
        <div className="limited-access-banner">
          <Lock size={18} />
          <span>Preview Mode: Showing {PUBLIC_PADDLE_LIMIT} popular paddles. </span>
          <Link to="/signup">Sign up free</Link>
          <span>or</span>
          <Link to="/login">Log in</Link>
          <span>to see all {paddles.length}+ paddles!</span>
        </div>
      )}

      {error && (
        <div className="paddle-error">
          <Info size={18} />
          {error}
        </div>
      )}

      {/* Comparison Panel */}
      {selectedPaddles.length > 0 && (
        <div className="compare-panel">
          <div className="compare-panel-header">
            <h3>
              <Scale size={20} />
              Comparing {selectedPaddles.length} Paddle{selectedPaddles.length > 1 ? 's' : ''}
            </h3>
            <button className="btn btn-secondary" onClick={clearComparison}>
              Clear All
            </button>
          </div>
          
          <div className="compare-table-container">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {selectedPaddles.map(paddle => (
                    <th key={paddle.id}>
                      <div className="compare-paddle-name">{paddle.name}</div>
                      <div className="compare-paddle-brand">{paddle.brand}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Price</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id} className="compare-price">
                      ${paddle.price?.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Rating</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>
                      <div className="compare-rating">
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                        {paddle.rating}
                        <span>({paddle.reviews})</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Weight</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>{paddle.weight}</td>
                  ))}
                </tr>
                <tr>
                  <td>Best For</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>
                      <div className="compare-tags">
                        {paddle.bestFor?.map((tag, i) => (
                          <span key={i} className="compare-tag">{tag}</span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Pros</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>
                      <ul className="compare-list pros">
                        {paddle.pros?.slice(0, 4).map((pro, i) => (
                          <li key={i}><Check size={14} /> {pro}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Cons</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>
                      <ul className="compare-list cons">
                        {paddle.cons?.slice(0, 4).map((con, i) => (
                          <li key={i}><X size={14} /> {con}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Action</td>
                  {selectedPaddles.map(paddle => (
                    <td key={paddle.id}>
                      <a 
                        href={paddle.dealUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        View Deal <ExternalLink size={14} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-category ${filterCategory === cat.id ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.id)}
              style={filterCategory === cat.id ? { backgroundColor: getCategoryColor(cat.id) } : {}}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFilters && (
        <div className="filters-expanded">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Max Price: ${priceRange[1]}</label>
            <input
              type="range"
              min="50"
              max="300"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            />
          </div>
        </div>
      )}

      {/* Paddles Grid */}
      <div className="paddles-grid">
        {filteredPaddles.map(paddle => (
          <div 
            key={paddle.id} 
            className={`paddle-card ${selectedPaddles.find(p => p.id === paddle.id) ? 'selected' : ''}`}
            onClick={() => togglePaddleSelection(paddle)}
          >
            <div 
              className="paddle-category-badge"
              style={{ backgroundColor: getCategoryColor(paddle.category) + '20', color: getCategoryColor(paddle.category) }}
            >
              {paddle.category?.charAt(0).toUpperCase() + paddle.category?.slice(1)}
            </div>
            
            <div className="paddle-header">
              <h3>{paddle.name}</h3>
              <span className="paddle-brand">{paddle.brand}</span>
            </div>

            <div className="paddle-price-rating">
              <div className="paddle-price">
                <DollarSign size={18} />
                {paddle.price?.toFixed(2)}
              </div>
              <div className="paddle-rating">
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <span>{paddle.rating}</span>
                <small>({paddle.reviews} reviews)</small>
              </div>
            </div>

            <p className="paddle-description">{paddle.description}</p>

            <div className="paddle-specs">
              <div className="paddle-spec">
                <span className="spec-label">Weight</span>
                <span className="spec-value">{paddle.weight}</span>
              </div>
              <div className="paddle-spec">
                <span className="spec-label">Surface</span>
                <span className="spec-value">{paddle.surface}</span>
              </div>
              <div className="paddle-spec">
                <span className="spec-label">Shape</span>
                <span className="spec-value">{paddle.shape}</span>
              </div>
            </div>

            <div className="paddle-tags">
              {paddle.bestFor?.map((tag, i) => (
                <span key={i} className="paddle-tag">{tag}</span>
              ))}
            </div>

            <div className="paddle-actions">
              <button className="btn btn-secondary btn-sm">
                {selectedPaddles.find(p => p.id === paddle.id) ? 'Remove from Compare' : 'Add to Compare'}
              </button>
              <a 
                href={paddle.dealUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                onClick={(e) => e.stopPropagation()}
              >
                View Deal <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Login CTA for non-logged-in users */}
      {!isLoggedIn && paddles.length > PUBLIC_PADDLE_LIMIT && (
        <div className="login-cta-card">
          <div className="login-cta-content">
            <div className="login-cta-icon">
              <Lock size={32} />
            </div>
            <h3>See All {paddles.length}+ Paddles</h3>
            <p>Create a free account to unlock:</p>
            <ul className="login-cta-features">
              <li><Check size={16} /> Full paddle database with detailed specs</li>
              <li><Check size={16} /> Compare up to 3 paddles side-by-side</li>
              <li><Check size={16} /> Real-time pricing from multiple retailers</li>
              <li><Check size={16} /> Community reviews and ratings</li>
            </ul>
            <div className="login-cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <LogIn size={18} />
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}

      {filteredPaddles.length === 0 && (
        <div className="paddles-empty">
          <Info size={48} />
          <p>No paddles match your filters. Try adjusting your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default PaddleCompare;
