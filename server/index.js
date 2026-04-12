const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'pickleball.db'));

db.serialize(() => {
  // Players table
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    skill_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Games table
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    court_fee REAL DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Game players junction table
  db.run(`CREATE TABLE IF NOT EXISTS game_players (
    game_id TEXT,
    player_id TEXT,
    team INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    paid BOOLEAN DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    PRIMARY KEY (game_id, player_id)
  )`);

  // Expenses table
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    game_id TEXT,
    payer_id TEXT,
    split_among_all BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (payer_id) REFERENCES players(id)
  )`);

  // Expense splits table
  db.run(`CREATE TABLE IF NOT EXISTS expense_splits (
    expense_id TEXT,
    player_id TEXT,
    amount REAL NOT NULL,
    paid BOOLEAN DEFAULT 0,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    PRIMARY KEY (expense_id, player_id)
  )`);
});

// ========== PLAYERS API ==========

// Get all players
app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create player
app.post('/api/players', (req, res) => {
  const { name, email, phone, skill_level } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO players (id, name, email, phone, skill_level) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, phone, skill_level],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, email, phone, skill_level });
    }
  );
});

// Update player
app.put('/api/players/:id', (req, res) => {
  const { name, email, phone, skill_level } = req.body;
  
  db.run(
    'UPDATE players SET name = ?, email = ?, phone = ?, skill_level = ? WHERE id = ?',
    [name, email, phone, skill_level, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, name, email, phone, skill_level });
    }
  );
});

// Delete player
app.delete('/api/players/:id', (req, res) => {
  db.run('DELETE FROM players WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Player deleted' });
  });
});

// ========== GAMES API ==========

// Get all games with players
app.get('/api/games', (req, res) => {
  db.all('SELECT * FROM games ORDER BY date DESC, time DESC', [], (err, games) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (games.length === 0) return res.json([]);
    
    // Get players for each game
    const gameIds = games.map(g => g.id);
    const placeholders = gameIds.map(() => '?').join(',');
    
    db.all(
      `SELECT gp.*, p.name, p.skill_level 
       FROM game_players gp 
       JOIN players p ON gp.player_id = p.id 
       WHERE gp.game_id IN (${placeholders})`,
      gameIds,
      (err, players) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const gamesWithPlayers = games.map(game => ({
          ...game,
          players: players.filter(p => p.game_id === game.id) || []
        }));
        
        res.json(gamesWithPlayers);
      }
    );
  });
});

// Create game
app.post('/api/games', (req, res) => {
  const { date, time, location, court_fee, notes, player_ids } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO games (id, date, time, location, court_fee, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [id, date, time, location, court_fee || 0, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Add players to game
      if (player_ids && player_ids.length > 0) {
        const stmt = db.prepare('INSERT INTO game_players (game_id, player_id) VALUES (?, ?)');
        player_ids.forEach(player_id => {
          stmt.run(id, player_id);
        });
        stmt.finalize();
      }
      
      res.json({ id, date, time, location, court_fee, notes, status: 'scheduled' });
    }
  );
});

// Update game
app.put('/api/games/:id', (req, res) => {
  const { date, time, location, court_fee, status, notes, player_ids } = req.body;
  
  db.run(
    'UPDATE games SET date = ?, time = ?, location = ?, court_fee = ?, status = ?, notes = ? WHERE id = ?',
    [date, time, location, court_fee, status, notes, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update players
      if (player_ids) {
        db.run('DELETE FROM game_players WHERE game_id = ?', [req.params.id], function(err) {
          if (player_ids.length > 0) {
            const stmt = db.prepare('INSERT INTO game_players (game_id, player_id) VALUES (?, ?)');
            player_ids.forEach(pid => stmt.run(req.params.id, pid));
            stmt.finalize();
          }
        });
      }
      
      res.json({ id: req.params.id, date, time, location, court_fee, status, notes });
    }
  );
});

// Delete game
app.delete('/api/games/:id', (req, res) => {
  db.run('DELETE FROM game_players WHERE game_id = ?', [req.params.id], function(err) {
    db.run('DELETE FROM expenses WHERE game_id = ?', [req.params.id], function(err) {
      db.run('DELETE FROM games WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Game deleted' });
      });
    });
  });
});

// Update game score
app.put('/api/games/:id/score', (req, res) => {
  const { player_id, score, team } = req.body;
  
  db.run(
    'UPDATE game_players SET score = ?, team = ? WHERE game_id = ? AND player_id = ?',
    [score, team, req.params.id, player_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Score updated' });
    }
  );
});

// Mark player payment
app.put('/api/games/:id/payment', (req, res) => {
  const { player_id, paid } = req.body;
  
  db.run(
    'UPDATE game_players SET paid = ? WHERE game_id = ? AND player_id = ?',
    [paid ? 1 : 0, req.params.id, player_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Payment status updated' });
    }
  );
});

// ========== EXPENSES API ==========

// Get all expenses with details
app.get('/api/expenses', (req, res) => {
  db.all(
    `SELECT e.*, g.location as game_location, p.name as payer_name 
     FROM expenses e 
     LEFT JOIN games g ON e.game_id = g.id 
     LEFT JOIN players p ON e.payer_id = p.id 
     ORDER BY e.date DESC`,
    [],
    (err, expenses) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (expenses.length === 0) return res.json([]);
      
      // Get splits for each expense
      const expenseIds = expenses.map(e => e.id);
      const placeholders = expenseIds.map(() => '?').join(',');
      
      db.all(
        `SELECT es.*, p.name as player_name 
         FROM expense_splits es 
         JOIN players p ON es.player_id = p.id 
         WHERE es.expense_id IN (${placeholders})`,
        expenseIds,
        (err, splits) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const expensesWithSplits = expenses.map(exp => ({
            ...exp,
            splits: splits.filter(s => s.expense_id === exp.id) || []
          }));
          
          res.json(expensesWithSplits);
        }
      );
    }
  );
});

// Create expense
app.post('/api/expenses', (req, res) => {
  const { date, category, description, amount, game_id, payer_id, split_among_all, splits } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO expenses (id, date, category, description, amount, game_id, payer_id, split_among_all) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, date, category, description, amount, game_id, payer_id, split_among_all ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Add splits
      if (splits && splits.length > 0) {
        const stmt = db.prepare('INSERT INTO expense_splits (expense_id, player_id, amount) VALUES (?, ?, ?)');
        splits.forEach(split => {
          stmt.run(id, split.player_id, split.amount);
        });
        stmt.finalize();
      }
      
      res.json({ id, date, category, description, amount, game_id, payer_id, split_among_all });
    }
  );
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const { date, category, description, amount, game_id, payer_id, split_among_all, splits } = req.body;
  
  db.run(
    'UPDATE expenses SET date = ?, category = ?, description = ?, amount = ?, game_id = ?, payer_id = ?, split_among_all = ? WHERE id = ?',
    [date, category, description, amount, game_id, payer_id, split_among_all ? 1 : 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update splits
      if (splits) {
        db.run('DELETE FROM expense_splits WHERE expense_id = ?', [req.params.id], function(err) {
          if (splits.length > 0) {
            const stmt = db.prepare('INSERT INTO expense_splits (expense_id, player_id, amount) VALUES (?, ?, ?)');
            splits.forEach(split => stmt.run(req.params.id, split.player_id, split.amount));
            stmt.finalize();
          }
        });
      }
      
      res.json({ id: req.params.id, date, category, description, amount, game_id, payer_id, split_among_all });
    }
  );
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  db.run('DELETE FROM expense_splits WHERE expense_id = ?', [req.params.id], function(err) {
    db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Expense deleted' });
    });
  });
});

// Mark split as paid
app.put('/api/expenses/:id/payment', (req, res) => {
  const { player_id, paid } = req.body;
  
  db.run(
    'UPDATE expense_splits SET paid = ? WHERE expense_id = ? AND player_id = ?',
    [paid ? 1 : 0, req.params.id, player_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Payment status updated' });
    }
  );
});

// ========== DASHBOARD API ==========

app.get('/api/dashboard', (req, res) => {
  const dashboard = {};
  
  // Total games
  db.get('SELECT COUNT(*) as count FROM games', [], (err, row) => {
    dashboard.totalGames = row?.count || 0;
    
    // Total players
    db.get('SELECT COUNT(*) as count FROM players', [], (err, row) => {
      dashboard.totalPlayers = row?.count || 0;
      
      // Total expenses
      db.get('SELECT COALESCE(SUM(amount), 0) as total FROM expenses', [], (err, row) => {
        dashboard.totalExpenses = row?.total || 0;
        
        // Upcoming games
        db.all(
          "SELECT * FROM games WHERE date >= date('now') AND status = 'scheduled' ORDER BY date, time LIMIT 5",
          [],
          (err, games) => {
            dashboard.upcomingGames = games || [];
            
            // Recent expenses
            db.all(
              'SELECT e.*, p.name as payer_name FROM expenses e LEFT JOIN players p ON e.payer_id = p.id ORDER BY e.date DESC LIMIT 5',
              [],
              (err, expenses) => {
                dashboard.recentExpenses = expenses || [];
                res.json(dashboard);
              }
            );
          }
        );
      });
    });
  });
});

// ========== BALANCE SHEET API ==========

app.get('/api/balances', (req, res) => {
  db.all('SELECT id, name FROM players', [], (err, players) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const balances = {};
    players.forEach(p => balances[p.id] = { name: p.name, paid: 0, owes: 0, net: 0 });
    
    // Calculate what each player paid
    db.all(
      `SELECT payer_id, SUM(amount) as total FROM expenses WHERE payer_id IS NOT NULL GROUP BY payer_id`,
      [],
      (err, paid) => {
        if (paid) {
          paid.forEach(p => {
            if (balances[p.payer_id]) balances[p.payer_id].paid = p.total;
          });
        }
        
        // Calculate what each player owes
        db.all(
          `SELECT player_id, SUM(amount) as total FROM expense_splits GROUP BY player_id`,
          [],
          (err, owes) => {
            if (owes) {
              owes.forEach(o => {
                if (balances[o.player_id]) balances[o.player_id].owes = o.total;
              });
            }
            
            // Calculate net
            Object.keys(balances).forEach(id => {
              balances[id].net = balances[id].paid - balances[id].owes;
            });
            
            res.json(balances);
          }
        );
      }
    );
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
