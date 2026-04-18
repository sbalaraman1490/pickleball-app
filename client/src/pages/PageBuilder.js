import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Layout, Type, Image as ImageIcon, List, CheckSquare, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './PageBuilder.css';

function PageBuilder() {
  const [searchParams] = useSearchParams();
  const menuId = searchParams.get('menuId');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [pageContent, setPageContent] = useState(null);
  const [formData, setFormData] = useState({
    template_type: 'text',
    title: '',
    content: '',
    sections: []
  });

  const templates = [
    { id: 'text', name: 'Text Content', icon: Type, description: 'Simple text content' },
    { id: 'hero', name: 'Hero Section', icon: Layout, description: 'Large hero section with title' },
    { id: 'image-text', name: 'Image + Text', icon: ImageIcon, description: 'Image with accompanying text' },
    { id: 'list', name: 'List Content', icon: List, description: 'Bulleted or numbered lists' },
    { id: 'features', name: 'Features Grid', icon: CheckSquare, description: 'Grid of feature cards' }
  ];

  useEffect(() => {
    if (menuId) {
      fetchPageContent(menuId);
    }
  }, [menuId]);

  const fetchPageContent = async (id) => {
    try {
      const data = await apiFetch(`/api/admin/page-content/${id}`);
      if (data.content) {
        setPageContent(data.content);
        setFormData({
          template_type: data.content.template_type,
          title: data.content.title || '',
          content: data.content.content || '',
          sections: data.content.sections || []
        });
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await apiFetch('/api/admin/page-content', {
        method: 'POST',
        body: JSON.stringify({
          menu_item_id: menuId,
          ...formData
        })
      });

      setMessage('Page content saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving page content:', error);
      setMessage('Failed to save page content');
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        { id: Date.now(), type: 'text', content: '', title: '' }
      ]
    });
  };

  const updateSection = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index][field] = value;
    setFormData({ ...formData, sections: newSections });
  };

  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: newSections });
  };

  return (
    <div className="page-builder">
      <div className="page-builder-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <ArrowLeft size={20} /> Back to Menu Builder
        </button>
        <h1>Page Builder</h1>
        <button className="save-button" onClick={handleSave}>
          <Save size={18} /> Save
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading page content...</div>
      ) : (
        <div className="page-builder-content">
          <form onSubmit={handleSave}>
            <div className="form-section">
              <h3>Select Template</h3>
              <div className="templates-grid">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`template-card ${formData.template_type === template.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, template_type: template.id })}
                  >
                    <template.icon size={32} />
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Page Title</h3>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter page title"
                className="title-input"
              />
            </div>

            <div className="form-section">
              <h3>Main Content</h3>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter main content..."
                rows="10"
                className="content-textarea"
              />
            </div>

            {(formData.template_type === 'hero' || formData.template_type === 'features') && (
              <div className="form-section">
                <div className="section-header">
                  <h3>Sections</h3>
                  <button type="button" className="add-section-btn" onClick={addSection}>
                    + Add Section
                  </button>
                </div>
                {formData.sections.map((section, index) => (
                  <div key={section.id} className="section-card">
                    <div className="section-header">
                      <h4>Section {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-section-btn"
                        onClick={() => removeSection(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                      placeholder="Section title"
                      className="section-input"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, 'content', e.target.value)}
                      placeholder="Section content"
                      rows="4"
                      className="section-textarea"
                    />
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default PageBuilder;
