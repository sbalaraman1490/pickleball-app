import React, { useState, useEffect } from 'react';
import './AltaPerformance.css';

const AltaPerformance = () => {
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Sample data structure based on the standings sheet
  const sampleData = {
    season: "2026 Spring",
    league: "Pickleball Mixed",
    level: "B-8",
    division: "Division 4",
    weeks: 7,
    teams: [
      {
        rank: 1,
        name: "FOWLER PARK PICKLEBALL (PANDARATHODI)",
        captain: "PANDARATHODI",
        weeklyResults: [
          { week: 1, gamesWon: 12, gamesPlayed: 4 },
          { week: 2, gamesWon: 6, gamesPlayed: 2 },
          { week: 3, gamesWon: 10, gamesPlayed: 3 },
          { week: 4, gamesWon: 3, gamesPlayed: 2 },
          { week: 5, gamesWon: 3, gamesPlayed: 3 },
          { week: 6, gamesWon: 10, gamesPlayed: 4 },
          { week: 7, bye: true }
        ],
        totalGames: 44,
        maxGames: 72,
        winPercentage: 61.111,
        pointsPercentage: 56.843
      },
      {
        rank: 2,
        name: "FOWLER PARK PICKLEBALL (THOMAS)",
        captain: "THOMAS",
        weeklyResults: [
          { week: 1, gamesWon: 4, gamesPlayed: 3 },
          { week: 2, gamesWon: 6, gamesPlayed: 1 },
          { week: 3, gamesWon: 12, gamesPlayed: 4 },
          { week: 4, gamesWon: 9, gamesPlayed: 1 },
          { week: 5, gamesWon: 10, gamesPlayed: 4 },
          { week: 6, gamesWon: 5, gamesPlayed: 3 },
          { week: 7, bye: true }
        ],
        totalGames: 46,
        maxGames: 72,
        winPercentage: 63.889,
        pointsPercentage: 55.549
      },
      {
        rank: 3,
        name: "MIDWAY PARK (JOSEPH)",
        captain: "JOSEPH",
        weeklyResults: [
          { week: 1, gamesWon: 8, gamesPlayed: 2 },
          { week: 2, gamesWon: 11, gamesPlayed: 4 },
          { week: 3, gamesWon: 2, gamesPlayed: 1 },
          { week: 4, gamesWon: 10, gamesPlayed: 4 },
          { week: 5, gamesWon: 9, gamesPlayed: 1 },
          { week: 6, gamesWon: 7, gamesPlayed: 2 },
          { week: 7, bye: true }
        ],
        totalGames: 47,
        maxGames: 72,
        winPercentage: 65.278,
        pointsPercentage: 57.073
      },
      {
        rank: 4,
        name: "PARKSTONE (LANCASTER)",
        captain: "LANCASTER",
        weeklyResults: [
          { week: 1, gamesWon: 0, gamesPlayed: 1 },
          { week: 2, gamesWon: 1, gamesPlayed: 3 },
          { week: 3, gamesWon: 0, gamesPlayed: 2 },
          { week: 4, gamesWon: 2, gamesPlayed: 3 },
          { week: 5, gamesWon: 2, gamesPlayed: 2 },
          { week: 6, gamesWon: 2, gamesPlayed: 1 },
          { week: 7, bye: true }
        ],
        totalGames: 7,
        maxGames: 72,
        winPercentage: 9.722,
        pointsPercentage: 28.219
      }
    ]
  };

  useEffect(() => {
    // Load data - in production this would come from an API or import
    setSeasonData(sampleData);
  }, []);

  const handleTeamClick = (team) => {
    setSelectedTeam(selectedTeam?.name === team.name ? null : team);
  };

  const getWeeklyResultDisplay = (result) => {
    if (result.bye) return <span className="bye-indicator">Bye</span>;
    return (
      <div className="weekly-result">
        <span className="games-won">{result.gamesWon}</span>
        <span className="games-played">/{result.gamesPlayed}</span>
      </div>
    );
  };

  const renderStandingsTable = () => {
    if (!seasonData) return null;

    return (
      <div className="standings-container">
        <div className="standings-header">
          <h2>{seasonData.season} {seasonData.league}</h2>
          <p className="division-info">{seasonData.level}, {seasonData.division}</p>
        </div>

        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-grid">
            <div className="legend-item"><strong>Gms</strong> Games</div>
            <div className="legend-item"><strong>Vs</strong> Team Played</div>
            <div className="legend-item"><strong>%</strong> Points Won %</div>
            <div className="legend-item"><strong>C</strong> City Winner</div>
            <div className="legend-item"><strong>D</strong> Division Winner</div>
            <div className="legend-item"><strong>L</strong> Losing</div>
            <div className="legend-item"><strong>W</strong> Worst</div>
            <div className="legend-item"><strong>X</strong> Default</div>
          </div>
        </div>

        <div className="standings-table-wrapper">
          <table className="standings-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th className="team-col">Team</th>
                {Array.from({ length: seasonData.weeks }, (_, i) => (
                  <th key={i} colSpan={2} className="week-header">
                    Week {i + 1}
                  </th>
                ))}
                <th className="total-col">Total<br/>Gms</th>
                <th className="max-col">Max<br/>Gms</th>
                <th className="pct-col">%</th>
                <th className="points-col">Points<br/>Won %</th>
                <th className="final-col">Final<br/>Rank</th>
              </tr>
              <tr className="sub-header">
                <th colSpan={2}></th>
                {Array.from({ length: seasonData.weeks }, (_, i) => (
                  <React.Fragment key={i}>
                    <th className="games-col">Gms</th>
                    <th className="vs-col">Vs</th>
                  </React.Fragment>
                ))}
                <th colSpan={5}></th>
              </tr>
            </thead>
            <tbody>
              {seasonData.teams.map((team) => (
                <tr 
                  key={team.name} 
                  className={`team-row ${selectedTeam?.name === team.name ? 'selected' : ''}`}
                  onClick={() => handleTeamClick(team)}
                >
                  <td className="rank-cell">{team.rank}</td>
                  <td className="team-cell">
                    <div className="team-name">{team.name}</div>
                    <div className="captain-name">({team.captain})</div>
                  </td>
                  {team.weeklyResults.map((result, idx) => (
                    <React.Fragment key={idx}>
                      <td className="games-cell">
                        {result.bye ? '-' : result.gamesWon}
                      </td>
                      <td className="vs-cell">
                        {result.bye ? 'Bye' : result.gamesPlayed}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="total-cell">{team.totalGames}</td>
                  <td className="max-cell">{team.maxGames}</td>
                  <td className="pct-cell">{team.winPercentage.toFixed(3)}</td>
                  <td className="points-cell">{team.pointsPercentage.toFixed(3)}</td>
                  <td className="final-rank-cell">{team.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedTeam && (
          <div className="team-detail-panel">
            <h3>{selectedTeam.name} - Performance Details</h3>
            <div className="detail-stats">
              <div className="stat-card">
                <div className="stat-value">{selectedTeam.totalGames}</div>
                <div className="stat-label">Games Won</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{selectedTeam.winPercentage.toFixed(1)}%</div>
                <div className="stat-label">Win Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">#{selectedTeam.rank}</div>
                <div className="stat-label">Current Rank</div>
              </div>
            </div>
            <div className="weekly-breakdown">
              <h4>Weekly Breakdown</h4>
              <div className="week-grid">
                {selectedTeam.weeklyResults.map((result, idx) => (
                  <div key={idx} className={`week-card ${result.bye ? 'bye' : ''}`}>
                    <div className="week-label">Week {idx + 1}</div>
                    {getWeeklyResultDisplay(result)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatchSchedule = () => {
    return (
      <div className="schedule-container">
        <h3>Upcoming Matches</h3>
        <div className="schedule-list">
          <div className="match-card">
            <div className="match-week">Week 8</div>
            <div className="match-teams">
              <div className="team home">
                <span className="team-badge">DINKANS</span>
                <span className="score">-</span>
              </div>
              <div className="vs-divider">VS</div>
              <div className="team away">
                <span className="score">-</span>
                <span className="team-badge">OPPONENT</span>
              </div>
            </div>
            <div className="match-details">
              <p>Sunday, May 18, 2026</p>
              <p>2:00 PM @ Dinkans Courts</p>
            </div>
          </div>
          <p className="schedule-note">* Schedule sync with ALTA coming soon</p>
        </div>
      </div>
    );
  };

  return (
    <div className="alta-performance">
      <div className="alta-header">
        <div className="alta-logo">
          <img src="/alta-logo.png" alt="ALTA" onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }} />
          <div className="alta-logo-fallback" style={{display: 'none'}}>
            <span>ALTA</span>
          </div>
        </div>
        <div className="alta-title">
          <h1>Dinkans ALTA Performance</h1>
          <p>Atlanta Lawn Tennis Association League Tracking</p>
        </div>
      </div>

      <div className="alta-tabs">
        <button 
          className={`tab-btn ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Division Standings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Match Schedule
        </button>
        <button 
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Team Roster
        </button>
      </div>

      <div className="alta-content">
        {activeTab === 'standings' && renderStandingsTable()}
        {activeTab === 'schedule' && renderMatchSchedule()}
        {activeTab === 'players' && (
          <div className="roster-placeholder">
            <h3>Team Roster</h3>
            <p>Player management and stats coming soon!</p>
            <p>Import your ALTA roster CSV to get started.</p>
          </div>
        )}
      </div>

      <div className="alta-actions">
        <button className="import-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import ALTA Data
        </button>
        <button className="export-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Report
        </button>
      </div>
    </div>
  );
};

export default AltaPerformance;
