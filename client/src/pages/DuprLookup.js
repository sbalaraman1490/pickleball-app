import React, { useState, useCallback } from 'react';
import { Upload, FileText, Search, User, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import './DuprLookup.css';

const DuprLookup = () => {
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [singleSearch, setSingleSearch] = useState({ firstName: '', lastName: '', state: 'GA' });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setUploadFile(file);
      setError('');
      setUploadResults(null);
    } else {
      setError('Please select an Excel file (.xlsx or .xls)');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('excelFile', uploadFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dupr/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResults(data);
        setUploadFile(null);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleSearch = async () => {
    if (!singleSearch.firstName.trim() || !singleSearch.lastName.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dupr/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(singleSearch)
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResult(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const downloadResults = () => {
    if (!uploadResults?.results) return;

    const csvContent = [
      ['First Name', 'Last Name', 'State', 'DUPR Rating', 'Doubles Reliability'],
      ...uploadResults.results.map(r => [
        r.firstName,
        r.lastName,
        r.state,
        r.duprRating,
        r.doublesReliability
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dupr-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dupr-lookup">
      <div className="dupr-header">
        <h1>DUPR Rating Lookup</h1>
        <p>Search player ratings from DUPR database</p>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="close-error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="dupr-content">
        {/* Single Player Search */}
        <div className="search-section">
          <h2>
            <Search size={24} />
            Single Player Search
          </h2>
          <div className="search-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="First Name"
                value={singleSearch.firstName}
                onChange={(e) => setSingleSearch({...singleSearch, firstName: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={singleSearch.lastName}
                onChange={(e) => setSingleSearch({...singleSearch, lastName: e.target.value})}
                className="form-input"
              />
              <select
                value={singleSearch.state}
                onChange={(e) => setSingleSearch({...singleSearch, state: e.target.value})}
                className="form-select"
              >
                <option value="GA">Georgia</option>
                <option value="FL">Florida</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NC">North Carolina</option>
              </select>
              <button
                onClick={handleSingleSearch}
                disabled={isSearching}
                className="search-button"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResult && (
            <div className="search-result">
              <div className="result-header">
                <CheckCircle size={20} className="success-icon" />
                <h3>Player Found</h3>
              </div>
              <div className="result-details">
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{searchResult.firstName} {searchResult.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">State:</span>
                  <span className="value">{searchResult.state}</span>
                </div>
                <div className="detail-row">
                  <span className="label">DUPR Rating:</span>
                  <span className="value rating">{searchResult.duprRating}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Doubles Reliability:</span>
                  <span className="value reliability">{searchResult.doublesReliability}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Upload Section */}
        <div className="upload-section">
          <h2>
            <Upload size={24} />
            Bulk Excel Upload
          </h2>
          <p className="upload-description">
            Upload an Excel file with columns: "First Name" and "Last Name" 
            (or "firstName", "lastName", etc.)
          </p>

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
                {isUploading ? 'Processing...' : 'Upload and Process'}
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
            <div className="upload-results">
              <div className="results-header">
                <h3>Upload Complete</h3>
                <button onClick={downloadResults} className="download-button">
                  <Download size={16} />
                  Download CSV
                </button>
              </div>
              
              <div className="results-summary">
                <div className="summary-item success">
                  <span className="count">{uploadResults.successful}</span>
                  <span className="label">Successful</span>
                </div>
                <div className="summary-item error">
                  <span className="count">{uploadResults.failed}</span>
                  <span className="label">Failed</span>
                </div>
                <div className="summary-item total">
                  <span className="count">{uploadResults.totalProcessed}</span>
                  <span className="label">Total</span>
                </div>
              </div>

              {uploadResults.results.length > 0 && (
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>State</th>
                        <th>DUPR Rating</th>
                        <th>Doubles Reliability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResults.results.map((result) => (
                        <tr key={result.id}>
                          <td>{result.firstName} {result.lastName}</td>
                          <td>{result.state}</td>
                          <td className="rating">{result.duprRating}</td>
                          <td className="reliability">{result.doublesReliability}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {uploadResults.errors.length > 0 && (
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
    </div>
  );
};

export default DuprLookup;
