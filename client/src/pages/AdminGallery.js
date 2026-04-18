import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './AdminGallery.css';

function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [message, setMessage] = useState('');
  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await apiFetch('/api/gallery');
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setMessage('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      await apiFetch('/api/gallery/upload', {
        method: 'POST',
        body: JSON.stringify(newImage)
      });

      setMessage('Image uploaded successfully');
      setNewImage({ title: '', description: '', image_url: '' });
      setShowUploadModal(false);
      fetchGallery();
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await apiFetch(`/api/gallery/${imageId}`, { method: 'DELETE' });
      setMessage('Image deleted successfully');
      fetchGallery();
    } catch (error) {
      console.error('Error deleting image:', error);
      setMessage('Failed to delete image');
    }
  };

  return (
    <div className="admin-gallery">
      <div className="admin-gallery-header">
        <h1><ImageIcon size={28} /> Gallery Management</h1>
        <button
          className="upload-button"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus size={20} /> Add Image
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <Loader2 className="spinner" size={40} />
          <p>Loading gallery...</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.length === 0 ? (
            <div className="empty-state">
              <ImageIcon size={48} />
              <p>No images in the gallery yet</p>
              <button onClick={() => setShowUploadModal(true)}>
                <Plus size={20} /> Add Your First Image
              </button>
            </div>
          ) : (
            images.map((image) => (
              <div key={image.id} className="gallery-item">
                <div className="image-container">
                  <img src={image.image_url} alt={image.title} />
                  <div className="image-overlay">
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(image.id)}
                      title="Delete image"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="image-info">
                  <h3>{image.title}</h3>
                  {image.description && <p>{image.description}</p>}
                  <small>Added: {new Date(image.created_at).toLocaleDateString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Upload size={24} /> Upload Image</h2>
              <button onClick={() => setShowUploadModal(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newImage.title}
                  onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                  placeholder="Enter image title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newImage.description}
                  onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                  placeholder="Enter image description (optional)"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  value={newImage.image_url}
                  onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <small>Enter the URL of the image you want to add to the gallery</small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="primary">
                  {uploading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminGallery;
