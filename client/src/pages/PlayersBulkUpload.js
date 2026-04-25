import React, { useState } from 'react';
import { Upload, FileText, Download, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import './PlayersBulkUpload.css';

function PlayersBulkUpload() {
  const navigate = useNavigate();
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('excelFile', uploadFile);

    try {
      const response = await apiFetch('/api/admin/players/bulk-import', {
        method: 'POST',
        body: formData,
      });

      setUploadResults(response);
    } catch (error) {
      console.error('Error uploading players:', error);
      setUploadResults({
        success: false,
        error: error.message || 'Failed to upload players'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Gender', 'Team', 'Role', 'Alta registration id', 'Email', 'Phone', 'Skill Level'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="players-bulk-upload">
      <div className="upload-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1><Upload size={28} /> Bulk Player Import</h1>
        <button className="template-button" onClick={downloadTemplate}>
          <Download size={16} />
          Download Template
        </button>
      </div>

      <div className="upload-section">
        <div className="upload-info">
          <h3>Excel File Format</h3>
          <p>Upload an Excel file (.xlsx or .xls) with the following columns:</p>
          <ul>
            <li><strong>Name</strong> (required) - Player's full name</li>
            <li><strong>Gender</strong> - Male/Female</li>
            <li><strong>Team</strong> - Team name</li>
            <li><strong>Role</strong> - Player's role/position</li>
            <li><strong>Alta registration id</strong> - ALTA ID number</li>
            <li><strong>Email</strong> - Player's email (optional)</li>
            <li><strong>Phone</strong> - Player's phone (optional)</li>
            <li><strong>Skill Level</strong> - Beginner/Intermediate/Advanced (optional)</li>
          </ul>
        </div>

        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            <FileText size={48} />
            <span className="upload-text">
              {uploadFile ? uploadFile.name : 'Drop Excel file here or click to browse'}
            </span>
            <span className="upload-subtext">
              Supports .xlsx and .xls files (Max 10MB)
            </span>
          </label>
        </div>

        {uploadFile && (
          <div className="file-actions">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="upload-button"
            >
              {isUploading ? 'Processing...' : 'Upload and Import Players'}
            </button>
            <button
              onClick={() => {
                setUploadFile(null);
                setUploadResults(null);
              }}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        )}

        {uploadResults && (
          <div className={`results-section ${uploadResults.success ? 'success' : 'error'}`}>
            <h3>
              {uploadResults.success ? (
                <><Check size={24} /> Import Complete</>
              ) : (
                <><AlertCircle size={24} /> Import Failed</>
              )}
            </h3>

            {uploadResults.success && (
              <div className="results-summary">
                <div className="summary-item success">
                  <span className="count">{uploadResults.successful}</span>
                  <span className="label">Successfully Added</span>
                </div>
                <div className="summary-item total">
                  <span className="count">{uploadResults.totalProcessed}</span>
                  <span className="label">Total Processed</span>
                </div>
                {uploadResults.failed > 0 && (
                  <div className="summary-item error">
                    <span className="count">{uploadResults.failed}</span>
                    <span className="label">Failed</span>
                  </div>
                )}
              </div>
            )}

            {uploadResults.error && (
              <div className="error-message">
                {uploadResults.error}
              </div>
            )}

            {uploadResults.players && uploadResults.players.length > 0 && (
              <div className="players-list">
                <h4>Imported Players</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ALTA ID</th>
                      <th>Team</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResults.players.map((player) => (
                      <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player.alta_id || '-'}</td>
                        <td>{player.team || '-'}</td>
                        <td>{player.role || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {uploadResults.errors && uploadResults.errors.length > 0 && (
              <div className="errors-section">
                <h4>Errors</h4>
                <div className="error-list">
                  {uploadResults.errors.map((error, index) => (
                    <div key={index} className="error-item">
                      <AlertCircle size={16} />
                      <span>Row {error.row}: {error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayersBulkUpload;
