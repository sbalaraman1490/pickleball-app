import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Share2, User, Clock, TrendingUp, Calendar, Trophy, Zap } from 'lucide-react';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [filter, setFilter] = useState('all');

  // Simulated feed data - in production, this would come from an API
  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        type: 'announcement',
        author: 'Dinkans Team',
        authorRole: 'admin',
        avatar: '🏓',
        content: '🎉 Welcome to the new Dinkans Community Feed! Share your pickleball moments, discuss strategies, and connect with fellow players. Let\'s build our community together!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 24,
        comments: 8,
        liked: false
      },
      {
        id: 2,
        type: 'game_result',
        author: 'Sarah Chen',
        avatar: 'SC',
        content: 'What a match today! Came back from 9-4 down to win 12-10. The key was staying patient at the kitchen line. That third shot drop made all the difference! 🏆',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes: 18,
        comments: 5,
        liked: true,
        gameStats: {
          score: '12-10',
          duration: '25 min',
          highlight: 'Epic comeback'
        }
      },
      {
        id: 3,
        type: 'tip',
        author: 'Coach Mike',
        authorRole: 'coach',
        avatar: 'CM',
        content: '📚 Tip of the Day: When dinking, focus on placement over power. Aim for your opponent\'s feet or the corners. A soft, well-placed shot beats a hard shot down the middle every time!',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        likes: 42,
        comments: 12,
        liked: false
      },
      {
        id: 4,
        type: 'discussion',
        author: 'Raj Patel',
        avatar: 'RP',
        content: 'Question for the community: What\'s your go-to third shot drop strategy? I\'ve been practicing the "push drop" but struggling with consistency. Any advice?',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        likes: 15,
        comments: 23,
        liked: false
      },
      {
        id: 5,
        type: 'news',
        author: 'Pickleball Weekly',
        authorRole: 'news',
        avatar: '📰',
        content: '📈 Breaking: Pickleball participation grew by 85% in 2024! The sport now has over 13.6 million players in the US alone. Major League Pickleball announces expansion to 12 teams for 2025 season.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        likes: 67,
        comments: 14,
        liked: true,
        link: 'https://example.com/pickleball-news'
      },
      {
        id: 6,
        type: 'event',
        author: 'Dinkans Club',
        authorRole: 'organizer',
        avatar: '🎯',
        content: '🗓️ Upcoming Tournament Alert! Join us this Saturday for the Spring Classic Mixed Doubles tournament. Registration closes Friday at 6 PM. Prizes for winners!',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        likes: 31,
        comments: 9,
        liked: false,
        eventDetails: {
          date: 'This Saturday',
          time: '9:00 AM',
          location: 'Main Courts',
          registrationOpen: true
        }
      }
    ];

    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 800);
  }, []);

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  const handlePost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post = {
      id: Date.now(),
      type: 'discussion',
      author: 'You',
      avatar: 'ME',
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      liked: false
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getPostIcon = (type) => {
    switch (type) {
      case 'announcement': return <TrendingUp size={18} />;
      case 'game_result': return <Trophy size={18} />;
      case 'tip': return <Zap size={18} />;
      case 'news': return <TrendingUp size={18} />;
      case 'event': return <Calendar size={18} />;
      default: return <MessageSquare size={18} />;
    }
  };

  const getPostBadge = (type) => {
    const badges = {
      announcement: { text: 'Announcement', color: '#8b5cf6' },
      game_result: { text: 'Game Result', color: '#3b82f6' },
      tip: { text: 'Pro Tip', color: '#f59e0b' },
      news: { text: 'News', color: '#3b82f6' },
      event: { text: 'Event', color: '#ef4444' },
      discussion: { text: 'Discussion', color: '#6b7280' }
    };
    return badges[type] || badges.discussion;
  };

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(post => post.type === filter);

  return (
    <div>
      <div className="page-header">
        <h1>Community Feed</h1>
        <p>Stay connected with the latest news, tips, and community updates</p>
      </div>

      {/* New Post */}
      <div className="feed-post-card">
        <form onSubmit={handlePost} className="feed-post-form">
          <div className="feed-post-input">
            <div className="feed-avatar">ME</div>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with the community..."
              rows="3"
            />
          </div>
          <div className="feed-post-actions">
            <button type="submit" className="btn btn-primary" disabled={!newPost.trim()}>
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="feed-filters">
        <button 
          className={`feed-filter ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Posts
        </button>
        <button 
          className={`feed-filter ${filter === 'announcement' ? 'active' : ''}`}
          onClick={() => setFilter('announcement')}
        >
          Announcements
        </button>
        <button 
          className={`feed-filter ${filter === 'game_result' ? 'active' : ''}`}
          onClick={() => setFilter('game_result')}
        >
          Game Results
        </button>
        <button 
          className={`feed-filter ${filter === 'tip' ? 'active' : ''}`}
          onClick={() => setFilter('tip')}
        >
          Tips
        </button>
        <button 
          className={`feed-filter ${filter === 'event' ? 'active' : ''}`}
          onClick={() => setFilter('event')}
        >
          Events
        </button>
      </div>

      {/* Feed Posts */}
      <div className="feed-container">
        {loading ? (
          <div className="feed-loading">
            <div className="spin"></div>
            <p>Loading feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="feed-empty">
            <MessageSquare size={48} />
            <p>No posts found in this category</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="feed-post-card">
              <div className="feed-post-header">
                <div className="feed-author">
                  <div className="feed-avatar">{post.avatar}</div>
                  <div className="feed-author-info">
                    <span className="feed-author-name">
                      {post.author}
                      {post.authorRole && (
                        <span className={`feed-badge ${post.authorRole}`}>
                          {post.authorRole}
                        </span>
                      )}
                    </span>
                    <span className="feed-timestamp">
                      <Clock size={14} />
                      {formatTime(post.timestamp)}
                    </span>
                  </div>
                </div>
                <span 
                  className="feed-type-badge"
                  style={{ backgroundColor: getPostBadge(post.type).color + '20', color: getPostBadge(post.type).color }}
                >
                  {getPostIcon(post.type)}
                  {getPostBadge(post.type).text}
                </span>
              </div>

              <div className="feed-post-content">
                <p>{post.content}</p>
                
                {post.gameStats && (
                  <div className="feed-stats-box">
                    <div className="feed-stat">
                      <Trophy size={16} />
                      <span>{post.gameStats.score}</span>
                    </div>
                    <div className="feed-stat">
                      <Clock size={16} />
                      <span>{post.gameStats.duration}</span>
                    </div>
                    <div className="feed-stat highlight">
                      <Zap size={16} />
                      <span>{post.gameStats.highlight}</span>
                    </div>
                  </div>
                )}

                {post.eventDetails && (
                  <div className="feed-event-box">
                    <div className="feed-event-detail">
                      <Calendar size={16} />
                      <span>{post.eventDetails.date} at {post.eventDetails.time}</span>
                    </div>
                    <div className="feed-event-detail">
                      <User size={16} />
                      <span>{post.eventDetails.location}</span>
                    </div>
                    {post.eventDetails.registrationOpen && (
                      <span className="feed-event-badge">Registration Open</span>
                    )}
                  </div>
                )}
              </div>

              <div className="feed-post-footer">
                <button 
                  className={`feed-action ${post.liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <ThumbsUp size={18} />
                  <span>{post.likes}</span>
                </button>
                <button className="feed-action">
                  <MessageSquare size={18} />
                  <span>{post.comments}</span>
                </button>
                <button className="feed-action">
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;
