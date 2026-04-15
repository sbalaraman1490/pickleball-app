import React, { useState, useCallback } from 'react';
import { Upload, FileText, Search, User, AlertCircle, CheckCircle, Download, X, Database, Link, Edit3 } from 'lucide-react';
import './DuprLookup.css';

const DuprLookup = () => {
  const [uploadFile, setUploadFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [singleSearch, setSingleSearch] = useState({ firstName: '', lastName: '', state: 'GA' });
  const [playerIdSearch, setPlayerIdSearch] = useState('');
  const [tournamentUrl, setTournamentUrl] = useState('');
  const [manualEntry, setManualEntry] = useState({
    firstName: '',
    lastName: '',
    state: 'GA',
    duprRating: '',
    doublesReliability: '',
    notes: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isIdSearching, setIsIdSearching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [idSearchResult, setIdSearchResult] = useState(null);
  const [tournamentResults, setTournamentResults] = useState(null);
  const [manualResult, setManualResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

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

  const handleCsvSelect = (file) => {
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError('');
      setImportResults(null);
    } else {
      setError('Please select a CSV file (.csv)');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    handleCsvSelect(file);
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
      const response = await fetch('/api/dupr/upload', {
        method: 'POST',
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
      const response = await fetch('/api/dupr/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  // Handle CSV Import from DUPR Club Export
  const handleCsvImport = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first');
      return;
    }

    setIsImporting(true);
    setError('');

    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      const response = await fetch('/api/dupr/import-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResults(data);
        setCsvFile(null);
      } else {
        setError(data.error || 'CSV import failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle DUPR Player ID Lookup
  const handleIdSearch = async () => {
    if (!playerIdSearch.trim()) {
      setError('Please enter a DUPR Player ID');
      return;
    }

    setIsIdSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/dupr/player/${playerIdSearch}`);
      const data = await response.json();

      if (response.ok) {
        setIdSearchResult(data);
      } else {
        setError(data.error || 'Player ID lookup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsIdSearching(false);
    }
  };

  // Handle Tournament URL Parsing
  const handleTournamentParse = async () => {
    if (!tournamentUrl.trim()) {
      setError('Please enter a tournament URL');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const response = await fetch('/api/dupr/parse-tournament', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tournamentUrl })
      });

      const data = await response.json();

      if (response.ok) {
        setTournamentResults(data);
      } else {
        setError(data.error || 'Tournament parsing failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Manual Entry
  const handleManualSubmit = async () => {
    if (!manualEntry.firstName.trim() || !manualEntry.lastName.trim() || !manualEntry.duprRating) {
      setError('First name, last name, and DUPR rating are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/dupr/manual-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(manualEntry)
      });

      const data = await response.json();

      if (response.ok) {
        setManualResult(data);
        setManualEntry({
          firstName: '',
          lastName: '',
          state: 'GA',
          duprRating: '',
          doublesReliability: '',
          notes: ''
        });
      } else {
        setError(data.error || 'Manual entry failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Tab Navigation */}
      <div className="dupr-tabs">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={18} />
          Name Search
        </button>
        <button 
          className={`tab-button ${activeTab === 'id' ? 'active' : ''}`}
          onClick={() => setActiveTab('id')}
        >
          <Database size={18} />
          Player ID
        </button>
        <button 
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <FileText size={18} />
          Excel Upload
        </button>
        <button 
          className={`tab-button ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          <Upload size={18} />
          CSV Import
        </button>
        <button 
          className={`tab-button ${activeTab === 'tournament' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournament')}
        >
          <Link size={18} />
          Tournament
        </button>
        <button 
          className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <Edit3 size={18} />
          Manual Entry
        </button>
      </div>

      <div className="dupr-content">
        {/* Single Player Search */}
        {activeTab === 'search' && (
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
        )}

        {/* Bulk Excel Upload Section - Search by name list */}
        {activeTab === 'upload' && (
        <div className="upload-section">
          <h2>
            <Upload size={24} />
            Bulk Excel Upload (Search)
          </h2>
          <p className="upload-description">
            Upload an Excel file with player names to search for their DUPR ratings.
            Columns: "First Name" and "Last Name" (or "firstName", "lastName", etc.)
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
        )}

        {/* CSV Import Section */}
        {activeTab === 'csv' && (
        <div className="upload-section">
          <h2>
            <Database size={24} />
            Import DUPR CSV Export
          </h2>
          <p className="upload-description">
            Upload a CSV file exported from DUPR club admin panel. 
            Supports columns: First Name, Last Name, DUPR ID, Rating, Reliability
          </p>

          <div className="upload-area">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleCsvChange}
              className="file-input"
            />
            <label htmlFor="csv-upload" className="upload-label">
              <FileText size={48} />
              <span className="upload-text">
                {csvFile ? csvFile.name : 'Drop CSV file here or click to browse'}
              </span>
              <span className="upload-subtext">
                Supports .csv files from DUPR club exports
              </span>
            </label>
          </div>

          {csvFile && (
            <div className="file-actions">
              <button
                onClick={handleCsvImport}
                disabled={isImporting}
                className="upload-button"
              >
                {isImporting ? 'Importing...' : 'Import CSV'}
              </button>
              <button
                onClick={() => {
                  setCsvFile(null);
                  setImportResults(null);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          )}

          {importResults && (
            <div className="upload-results">
              <div className="results-header">
                <h3>Import Complete</h3>
              </div>
              
              <div className="results-summary">
                <div className="summary-item success">
                  <span className="count">{importResults.imported}</span>
                  <span className="label">Imported</span>
                </div>
                <div className="summary-item error">
                  <span className="count">{importResults.errors}</span>
                  <span className="label">Errors</span>
                </div>
                <div className="summary-item total">
                  <span className="count">{importResults.processed}</span>
                  <span className="label">Processed</span>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Player ID Lookup Section */}
        {activeTab === 'id' && (
        <div className="search-section">
          <h2>
            <Database size={24} />
            Lookup by DUPR Player ID
          </h2>
          <p className="upload-description">
            Enter a DUPR Player ID to fetch rating directly from their profile
          </p>

          <div className="search-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="DUPR Player ID (e.g., ABC123)"
                value={playerIdSearch}
                onChange={(e) => setPlayerIdSearch(e.target.value)}
                className="form-input"
              />
              <button
                onClick={handleIdSearch}
                disabled={isIdSearching}
                className="search-button"
              >
                {isIdSearching ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
          </div>

          {idSearchResult && (
            <div className="search-result">
              <div className="result-header">
                <CheckCircle size={20} className="success-icon" />
                <h3>Player Found</h3>
              </div>
              <div className="result-details">
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{idSearchResult.firstName} {idSearchResult.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Player ID:</span>
                  <span className="value">{idSearchResult.playerId}</span>
                </div>
                <div className="detail-row">
                  <span className="label">State:</span>
                  <span className="value">{idSearchResult.state}</span>
                </div>
                <div className="detail-row">
                  <span className="label">DUPR Rating:</span>
                  <span className="value rating">{idSearchResult.duprRating}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Doubles Reliability:</span>
                  <span className="value reliability">{idSearchResult.doublesReliability}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Tournament URL Parser Section */}
        {activeTab === 'tournament' && (
        <div className="search-section">
          <h2>
            <Link size={24} />
            Parse Tournament Results
          </h2>
          <p className="upload-description">
            Paste a tournament URL from PickleballTournaments.com, PickleballBrackets.com, or TournamentSoftware.com
            to extract player DUPR ratings
          </p>

          <div className="search-form">
            <div className="form-row single">
              <input
                type="url"
                placeholder="https://pickleballtournaments.com/tournament/..."
                value={tournamentUrl}
                onChange={(e) => setTournamentUrl(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                onClick={handleTournamentParse}
                disabled={isParsing}
                className="search-button"
              >
                {isParsing ? 'Parsing...' : 'Parse Tournament'}
              </button>
            </div>
          </div>

          {tournamentResults && (
            <div className="upload-results">
              <div className="results-header">
                <h3>Tournament Parsed</h3>
                <span className="count">{tournamentResults.playersFound} players found</span>
              </div>
              
              {tournamentResults.results.length > 0 && (
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>DUPR Rating</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentResults.results.map((player, index) => (
                        <tr key={index}>
                          <td>{player.firstName} {player.lastName}</td>
                          <td className="rating">{player.duprRating}</td>
                          <td>{player.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Manual Entry Section */}
        {activeTab === 'manual' && (
        <div className="search-section">
          <h2>
            <Edit3 size={24} />
            Manual DUPR Entry
          </h2>
          <p className="upload-description">
            Manually enter DUPR ratings when you have verified information
          </p>

          <div className="search-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="First Name"
                value={manualEntry.firstName}
                onChange={(e) => setManualEntry({...manualEntry, firstName: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={manualEntry.lastName}
                onChange={(e) => setManualEntry({...manualEntry, lastName: e.target.value})}
                className="form-input"
              />
              <select
                value={manualEntry.state}
                onChange={(e) => setManualEntry({...manualEntry, state: e.target.value})}
                className="form-select"
              >
                <option value="GA">Georgia</option>
                <option value="FL">Florida</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NC">North Carolina</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                step="0.001"
                placeholder="DUPR Rating (e.g., 4.250)"
                value={manualEntry.duprRating}
                onChange={(e) => setManualEntry({...manualEntry, duprRating: e.target.value})}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Reliability % (e.g., 85)"
                value={manualEntry.doublesReliability}
                onChange={(e) => setManualEntry({...manualEntry, doublesReliability: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <textarea
                placeholder="Notes (optional) - e.g., Source of this rating"
                value={manualEntry.notes}
                onChange={(e) => setManualEntry({...manualEntry, notes: e.target.value})}
                className="form-input"
                style={{ flex: 1, minHeight: '80px' }}
              />
            </div>
            <div className="form-row">
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="search-button"
                style={{ marginLeft: 'auto' }}
              >
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>

          {manualResult && (
            <div className="search-result">
              <div className="result-header">
                <CheckCircle size={20} className="success-icon" />
                <h3>Entry Saved</h3>
              </div>
              <div className="result-details">
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">{manualResult.message}</span>
                </div>
                {manualResult.verificationRequired && (
                  <div className="detail-row">
                    <span className="label">Note:</span>
                    <span className="value" style={{ color: '#f59e0b' }}>
                      This entry should be verified with official DUPR data
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default DuprLookup;
