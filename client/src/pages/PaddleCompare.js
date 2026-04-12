import React, { useState, useMemo } from 'react';
import { Scale, Star, DollarSign, Check, X, ExternalLink, Filter, ChevronDown, ChevronUp, Info } from 'lucide-react';
import './PaddleCompare.css';

function PaddleCompare() {
  const [selectedPaddles, setSelectedPaddles] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 300]);

  const paddles = [
    {
      id: 1,
      name: 'Selkirk Amped S2',
      brand: 'Selkirk',
      category: 'control',
      price: 149.99,
      rating: 4.8,
      reviews: 1247,
      weight: '7.8-8.2 oz',
      surface: 'FiberFlex Fiberglass',
      core: 'X5 Polymer',
      shape: 'Wide Body',
      grip: '4.25"',
      bestFor: ['Control', 'Touch', 'Beginners'],
      pros: ['Large sweet spot', 'Excellent control', 'Forgiving', 'Good for soft game'],
      cons: ['Less power', 'Heavier feel', 'Premium price'],
      dealUrl: 'https://selkirksport.com',
      description: 'The Amped S2 is known for its massive sweet spot and exceptional control, making it perfect for players who prioritize precision over power.'
    },
    {
      id: 2,
      name: 'Paddletek Tempest Wave Pro',
      brand: 'Paddletek',
      category: 'control',
      price: 179.99,
      rating: 4.7,
      reviews: 892,
      weight: '7.4-7.8 oz',
      surface: 'Graphite',
      core: 'Polymer',
      shape: 'Standard',
      grip: '4.25"',
      bestFor: ['Finesse', 'Touch Shots', 'Net Play'],
      pros: ['Lightweight', 'Great touch', 'Quick at net', 'Durable'],
      cons: ['Smaller sweet spot', 'Less power on drives', 'Pricey'],
      dealUrl: 'https://paddletek.com',
      description: 'The Tempest Wave Pro offers incredible touch and feel for players who dominate the kitchen with soft dinks and drop shots.'
    },
    {
      id: 3,
      name: 'Joola Ben Johns Hyperion CFS 16',
      brand: 'Joola',
      category: 'power',
      price: 279.99,
      rating: 4.9,
      reviews: 2156,
      weight: '8.4-8.8 oz',
      surface: 'Carbon Fiber',
      core: 'Polymer Honeycomb',
      shape: 'Elongated',
      grip: '4.25"',
      bestFor: ['Power', 'Professional', 'Aggressive Play'],
      pros: ['Maximum power', 'Excellent spin', 'Professional grade', 'Great reach'],
      cons: ['Expensive', 'Heavy', 'Steep learning curve'],
      dealUrl: 'https://joola.com',
      description: 'Co-designed with #1 player Ben Johns, this paddle delivers professional-level power and spin for aggressive players.'
    },
    {
      id: 4,
      name: 'Onix Evoke Premier',
      brand: 'Onix',
      category: 'balanced',
      price: 139.99,
      rating: 4.6,
      reviews: 1543,
      weight: '7.8-8.2 oz',
      surface: 'Composite',
      core: 'Polymer',
      shape: 'Wide Body',
      grip: '4.5"',
      bestFor: ['All-Around', 'Intermediate', 'Value'],
      pros: ['Good balance', 'Affordable', 'Versatile', 'Comfortable grip'],
      cons: ['Not specialized', 'Average power', 'Basic look'],
      dealUrl: 'https://onixpickleball.com',
      description: 'A great all-around paddle offering solid performance at an affordable price point for intermediate players.'
    },
    {
      id: 5,
      name: 'Gearbox GX6',
      brand: 'Gearbox',
      category: 'power',
      price: 199.99,
      rating: 4.7,
      reviews: 678,
      weight: '7.8 oz',
      surface: 'Solid Carbon Fiber',
      core: 'Solid Span Technology',
      shape: 'Elongated',
      grip: '4"',
      bestFor: ['Power', 'Durability', 'Edgeless Design'],
      pros: ['Unibody design', 'Extremely durable', 'No edge guard', 'Consistent hits'],
      cons: ['Unique feel', 'Pricey', 'Not for beginners'],
      dealUrl: 'https://gearboxsports.com',
      description: 'The GX6 features revolutionary solid construction with no edge guard, providing unmatched durability and consistent performance.'
    },
    {
      id: 6,
      name: 'Head Radical Pro',
      brand: 'Head',
      category: 'spin',
      price: 129.99,
      rating: 4.5,
      reviews: 923,
      weight: '8.1 oz',
      surface: 'Carbon Graphite',
      core: 'Polymer',
      shape: 'Standard',
      grip: '4.25"',
      bestFor: ['Spin', 'Intermediate', 'Control'],
      pros: ['Great spin', 'Comfortable', 'Well-made', 'Trusted brand'],
      cons: ['Moderate power', 'Average sweet spot', 'Basic aesthetics'],
      dealUrl: 'https://head.com',
      description: 'A solid performer from a trusted tennis brand, offering good spin potential and reliable control.'
    },
    {
      id: 7,
      name: 'Vulcan V730',
      brand: 'Vulcan',
      category: 'budget',
      price: 89.99,
      rating: 4.3,
      reviews: 456,
      weight: '7.6-8.0 oz',
      surface: 'Fiberglass',
      core: 'Polymer',
      shape: 'Wide Body',
      grip: '4.25"',
      bestFor: ['Beginners', 'Budget', 'Recreational'],
      pros: ['Affordable', 'Lightweight', 'Good starter', 'Colorful designs'],
      cons: ['Less durable', 'Basic performance', 'Small sweet spot'],
      dealUrl: 'https://vulcansporting.com',
      description: 'A great entry-level paddle that wont break the bank. Perfect for beginners and recreational players.'
    },
    {
      id: 8,
      name: 'Engage Pursuit MX 6.0',
      brand: 'Engage',
      category: 'balanced',
      price: 229.99,
      rating: 4.8,
      reviews: 1124,
      weight: '8.0-8.4 oz',
      surface: 'Raw Toray Carbon',
      core: 'Polymer',
      shape: 'Elongated',
      grip: '4.25"',
      bestFor: ['Spin', 'Control', 'Advanced'],
      pros: ['Excellent spin', 'Great control', 'Premium materials', 'Versatile'],
      cons: ['Expensive', 'Requires technique', 'Not forgiving'],
      dealUrl: 'https://engagesports.com',
      description: 'The Pursuit MX uses raw carbon fiber surface for maximum spin and control, designed for advanced players.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Paddles' },
    { id: 'control', label: 'Control' },
    { id: 'power', label: 'Power' },
    { id: 'balanced', label: 'Balanced' },
    { id: 'spin', label: 'Spin' },
    { id: 'budget', label: 'Budget' }
  ];

  const filteredPaddles = useMemo(() => {
    let result = paddles;

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

    return result;
  }, [filterCategory, priceRange, sortBy]);

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

  return (
    <div>
      <div className="page-header">
        <h1>Paddle Comparison</h1>
        <p>Compare pickleball paddles, find the best deals, and choose the perfect paddle for your game</p>
      </div>

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
                      ${paddle.price.toFixed(2)}
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
                        {paddle.bestFor.map((tag, i) => (
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
                        {paddle.pros.map((pro, i) => (
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
                        {paddle.cons.map((con, i) => (
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
                        href={paddle.dealUrl} 
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
              {paddle.category.charAt(0).toUpperCase() + paddle.category.slice(1)}
            </div>
            
            <div className="paddle-header">
              <h3>{paddle.name}</h3>
              <span className="paddle-brand">{paddle.brand}</span>
            </div>

            <div className="paddle-price-rating">
              <div className="paddle-price">
                <DollarSign size={18} />
                {paddle.price.toFixed(2)}
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
              {paddle.bestFor.map((tag, i) => (
                <span key={i} className="paddle-tag">{tag}</span>
              ))}
            </div>

            <div className="paddle-actions">
              <button className="btn btn-secondary btn-sm">
                {selectedPaddles.find(p => p.id === paddle.id) ? 'Remove from Compare' : 'Add to Compare'}
              </button>
              <a 
                href={paddle.dealUrl}
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
