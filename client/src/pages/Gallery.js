import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import './Gallery.css';

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await apiFetch('/api/gallery');
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1><ImageIcon size={32} /> Photo Gallery</h1>
        <p>Capture the moments, cherish the memories</p>
      </div>

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
              <small>Check back soon for updates!</small>
            </div>
          ) : (
            images.map((image) => (
              <div
                key={image.id}
                className="gallery-item"
                onClick={() => handleImageClick(image)}
              >
                <div className="image-container">
                  <img src={image.image_url} alt={image.title} />
                </div>
                <div className="image-info">
                  <h3>{image.title}</h3>
                  {image.description && <p>{image.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedImage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="close-button">
              ×
            </button>
            <img src={selectedImage.image_url} alt={selectedImage.title} />
            <div className="modal-info">
              <h2>{selectedImage.title}</h2>
              {selectedImage.description && <p>{selectedImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
