import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './DynamicPage.css';

function DynamicPage() {
  const { route } = useParams();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPageContent();
  }, [route]);

  const fetchPageContent = async () => {
    try {
      const data = await apiFetch(`/api/admin/page/${route}`);
      setContent(data.content);
    } catch (error) {
      console.error('Error fetching page content:', error);
      setError('Page not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dynamic-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading page...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="dynamic-page-error">
        <h2>Page Not Found</h2>
        <p>The requested page could not be found.</p>
      </div>
    );
  }

  const renderTemplate = () => {
    switch (content.template_type) {
      case 'hero':
        return (
          <div className="template-hero">
            <div className="hero-section">
              <h1>{content.title}</h1>
              <p className="hero-content">{content.content}</p>
            </div>
            {content.sections && content.sections.length > 0 && (
              <div className="sections-container">
                {content.sections.map((section, index) => (
                  <div key={section.id || index} className="section">
                    <h3>{section.title}</h3>
                    <p>{section.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'features':
        return (
          <div className="template-features">
            <h1>{content.title}</h1>
            <p className="main-content">{content.content}</p>
            {content.sections && content.sections.length > 0 && (
              <div className="features-grid">
                {content.sections.map((section, index) => (
                  <div key={section.id || index} className="feature-card">
                    <h3>{section.title}</h3>
                    <p>{section.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'image-text':
        return (
          <div className="template-image-text">
            <h1>{content.title}</h1>
            <div className="image-text-layout">
              <div className="text-content">
                <p>{content.content}</p>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="template-list">
            <h1>{content.title}</h1>
            <div className="list-content">
              {content.content.split('\n').map((item, index) => (
                item.trim() && (
                  <li key={index}>{item}</li>
                )
              ))}
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div className="template-text">
            <h1>{content.title}</h1>
            <div className="text-content">
              {content.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dynamic-page">
      {renderTemplate()}
    </div>
  );
}

export default DynamicPage;
