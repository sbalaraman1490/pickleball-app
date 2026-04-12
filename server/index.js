const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dinkans-secret-key-change-in-production';

// Email Configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dinkans.com';
const APP_URL = process.env.APP_URL || 'https://www.dinkans.com';

// Simple email sender function (uses SMTP if configured, otherwise logs)
async function sendEmail(to, subject, htmlContent, textContent) {
  // If no SMTP configured, just log the email (for development)
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('📧 EMAIL (Not sent - no SMTP configured):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${textContent}`);
    return { success: false, message: 'SMTP not configured - email logged only' };
  }

  try {
    // Dynamic import of nodemailer
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Dinkans" <${FROM_EMAIL}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email error:', error);
    return { success: false, error: error.message };
  }
}

// Email templates
function getRegistrationEmail(name, status) {
  const subject = status === 'approved' 
    ? 'Welcome to Dinkans - Your Account is Ready!'
    : 'Welcome to Dinkans - Account Pending Approval';
  
  const html = status === 'approved'
    ? `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}</style></head>
<body>
  <h2 style="color:#065f46">Welcome to Dinkans, ${name}!</h2>
  <p>Your account has been created and is ready to use.</p>
  <p><a href="${APP_URL}/login" style="background:#065f46;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:10px 0">Login Now</a></p>
  <p>Elevating Play, Building Community</p>
</body>
</html>`
    : `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}</style></head>
<body>
  <h2 style="color:#065f46">Welcome to Dinkans, ${name}!</h2>
  <p>Thank you for registering. Your account is currently pending admin approval.</p>
  <p>You will receive another email once your account has been approved.</p>
  <p>Elevating Play, Building Community</p>
</body>
</html>`;

  const text = status === 'approved'
    ? `Welcome to Dinkans, ${name}! Your account is ready. Login at ${APP_URL}/login`
    : `Welcome to Dinkans, ${name}! Your account is pending approval. You'll be notified once approved.`;

  return { subject, html, text };
}

function getApprovalEmail(name, approved, adminName) {
  const status = approved ? 'Approved' : 'Rejected';
  const color = approved ? '#059669' : '#dc2626';
  const action = approved ? 'approved' : 'rejected';
  const nextStep = approved 
    ? `<p>You can now <a href="${APP_URL}/login" style="background:#065f46;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:10px 0">Login to Dinkans</a></p>`
    : '<p>If you believe this was a mistake, please contact an administrator.</p>';
  
  const subject = `Dinkans Account ${status}`;
  const html = `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}</style></head>
<body>
  <h2 style="color:${color}">Account ${status}</h2>
  <p>Hello ${name},</p>
  <p>Your Dinkans account has been <strong style="color:${color}">${action}</strong> by ${adminName}.</p>
  ${nextStep}
  <p>Elevating Play, Building Community</p>
</body>
</html>`;

  const text = `Hello ${name}, Your Dinkans account has been ${action} by ${adminName}. ${approved ? `Login at ${APP_URL}/login` : 'Contact an administrator if you believe this was a mistake.'}`;

  return { subject, html, text };
}

function getExpenseEmail(userName, expenseDetails, status, adminName) {
  const statusColor = status === 'approved' ? '#059669' : '#dc2626';
  const subject = `Expense ${status === 'approved' ? 'Approved' : 'Rejected'} - Dinkans`;
  
  const html = `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}</style></head>
<body>
  <h2 style="color:${statusColor}">Expense ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
  <p>Hello ${userName},</p>
  <p>Your expense has been <strong style="color:${statusColor}">${status}</strong> by ${adminName}.</p>
  <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0">
    <p><strong>Amount:</strong> $${expenseDetails.amount}</p>
    <p><strong>Category:</strong> ${expenseDetails.category}</p>
    <p><strong>Description:</strong> ${expenseDetails.description || 'N/A'}</p>
  </div>
  <p><a href="${APP_URL}/app/expenses" style="background:#065f46;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:10px 0">View Expenses</a></p>
  <p>Elevating Play, Building Community</p>
</body>
</html>`;

  const text = `Hello ${userName}, Your expense ($${expenseDetails.amount} - ${expenseDetails.category}) has been ${status} by ${adminName}. View at ${APP_URL}/app/expenses`;

  return { subject, html, text };
}

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
    payment_amount REAL DEFAULT 0,
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
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    approved_by TEXT,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (payer_id) REFERENCES players(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
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

  // Users table for authentication
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    approved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ========== AUTHENTICATION MIDDLEWARE & API ==========

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    
    // Fetch full user details including role
    db.get('SELECT id, name, email, role, approved FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(403).json({ error: 'User not found' });
      if (!user.approved) return res.status(403).json({ error: 'Account pending approval. Please wait for admin approval.' });
      
      req.user = user;
      next();
    });
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    // Check if this is the first user - make them admin and auto-approve
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      const isFirstUser = row.count === 0;
      const role = isFirstUser ? 'admin' : 'user';
      const approved = isFirstUser ? 1 : 0;
      
      db.run(
        'INSERT INTO users (id, name, email, password, role, approved) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, email, hashedPassword, role, approved],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Email already registered' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          const message = isFirstUser 
            ? 'Registration successful. You are the admin user.'
            : 'Registration successful. Please wait for admin approval before logging in.';
          
          // Send welcome email
          const emailTemplate = getRegistrationEmail(name, approved === 1 ? 'approved' : 'pending');
          sendEmail(email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
          
          res.json({ 
            id, 
            name, 
            email, 
            role,
            approved: approved === 1,
            message 
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      if (!user.approved) {
        return res.status(403).json({ error: 'Account pending approval. Please wait for admin approval or contact an administrator.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role });
});

// Update profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, req.user.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: req.user.id, name, email, role: req.user.role });
    }
  );
});

// Change password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    // Get current user with password
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Password changed successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN API ==========

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, name, email, role, approved, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Approve user (admin only)
app.put('/api/admin/users/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const adminName = req.user.name;
  
  // Get user details before approving
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    db.run(
      'UPDATE users SET approved = 1 WHERE id = ?',
      [userId],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Send approval email
        const emailTemplate = getApprovalEmail(user.name, true, adminName);
        sendEmail(user.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
        
        res.json({ message: 'User approved successfully' });
      }
    );
  });
});

// Reject/Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const userId = req.params.id;
  const adminName = req.user.name;
  
  // Get user details before deleting for rejection email
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // If user was pending (not approved), send rejection email
    if (user && !user.approved) {
      const emailTemplate = getApprovalEmail(user.name, false, adminName);
      sendEmail(user.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
    }
    
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Change user role (admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  // Prevent admin from demoting themselves
  if (req.params.id === req.user.id && role === 'user') {
    return res.status(400).json({ error: 'Cannot demote yourself from admin' });
  }
  
  db.run(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User role updated successfully' });
    }
  );
});

// Create user (admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, role, approved } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const userRole = role || 'user';
    const isApproved = approved === false ? 0 : 1;
    
    db.run(
      'INSERT INTO users (id, name, email, password, role, approved) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, userRole, isApproved],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
          id, 
          name, 
          email, 
          role: userRole,
          approved: isApproved === 1,
          message: `User ${name} created successfully` 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending expenses (admin only)
app.get('/api/admin/expenses/pending', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT e.*, g.location as game_location, p.name as payer_name, u.name as creator_name 
     FROM expenses e 
     LEFT JOIN games g ON e.game_id = g.id 
     LEFT JOIN players p ON e.payer_id = p.id 
     LEFT JOIN users u ON e.created_by = u.id
     WHERE e.status = 'pending'
     ORDER BY e.created_at DESC`,
    [],
    (err, expenses) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (expenses.length === 0) return res.json([]);
      
      // Get splits for each expense
      const expenseIds = expenses.map(e => e.id);
      const placeholders = expenseIds.map(() => '?').join(',');
      
      db.all(
        `SELECT es.*, pl.name as player_name 
         FROM expense_splits es 
         JOIN players pl ON es.player_id = pl.id 
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

// Approve expense (admin only)
app.put('/api/admin/expenses/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const expenseId = req.params.id;
  const adminName = req.user.name;
  
  // Get expense and creator details
  db.get(
    `SELECT e.*, u.name as creator_name, u.email as creator_email 
     FROM expenses e 
     JOIN users u ON e.created_by = u.id 
     WHERE e.id = ?`,
    [expenseId],
    (err, expense) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        'UPDATE expenses SET status = ?, approved_by = ?, approved_at = datetime("now") WHERE id = ?',
        ['approved', req.user.id, expenseId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Send email notification to expense creator
          if (expense && expense.creator_email) {
            const emailTemplate = getExpenseEmail(
              expense.creator_name,
              { amount: expense.amount, category: expense.category, description: expense.description },
              'approved',
              adminName
            );
            sendEmail(expense.creator_email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
          }
          
          res.json({ message: 'Expense approved successfully' });
        }
      );
    }
  );
});

// Reject expense (admin only)
app.put('/api/admin/expenses/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  const expenseId = req.params.id;
  const adminName = req.user.name;
  
  // Get expense and creator details
  db.get(
    `SELECT e.*, u.name as creator_name, u.email as creator_email 
     FROM expenses e 
     JOIN users u ON e.created_by = u.id 
     WHERE e.id = ?`,
    [expenseId],
    (err, expense) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        'UPDATE expenses SET status = ? WHERE id = ?',
        ['rejected', expenseId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Send email notification to expense creator
          if (expense && expense.creator_email) {
            const emailTemplate = getExpenseEmail(
              expense.creator_name,
              { amount: expense.amount, category: expense.category, description: expense.description },
              'rejected',
              adminName
            );
            sendEmail(expense.creator_email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
          }
          
          res.json({ message: 'Expense rejected' });
        }
      );
    }
  );
});

// ========== PLAYERS API ==========

// Get all players (protected)
app.get('/api/players', authenticateToken, (req, res) => {
  db.all('SELECT * FROM players ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create player (protected)
app.post('/api/players', authenticateToken, (req, res) => {
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

// Update player (protected)
app.put('/api/players/:id', authenticateToken, (req, res) => {
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

// Delete player (protected)
app.delete('/api/players/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM players WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Player deleted' });
  });
});

// ========== GAMES API ==========

// Get all games with players (protected)
app.get('/api/games', authenticateToken, (req, res) => {
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

// Create game (protected)
app.post('/api/games', authenticateToken, (req, res) => {
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

// Update game (protected)
app.put('/api/games/:id', authenticateToken, (req, res) => {
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

// Delete game (protected)
app.delete('/api/games/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM game_players WHERE game_id = ?', [req.params.id], function(err) {
    db.run('DELETE FROM expenses WHERE game_id = ?', [req.params.id], function(err) {
      db.run('DELETE FROM games WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Game deleted' });
      });
    });
  });
});

// Update game score (protected)
app.put('/api/games/:id/score', authenticateToken, (req, res) => {
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

// Mark player payment (protected)
app.put('/api/games/:id/payment', authenticateToken, (req, res) => {
  const { player_id, paid, amount } = req.body;
  
  db.run(
    'UPDATE game_players SET paid = ?, payment_amount = ? WHERE game_id = ? AND player_id = ?',
    [paid ? 1 : 0, amount || 0, req.params.id, player_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Payment status updated' });
    }
  );
});

// Record game payment and create expense (protected)
app.post('/api/games/:id/record-payment', authenticateToken, (req, res) => {
  const { payer_id, amount, date } = req.body;
  const gameId = req.params.id;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  
  // Get game details and all players
  db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    db.all('SELECT player_id FROM game_players WHERE game_id = ?', [gameId], (err, gamePlayers) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const playerIds = gamePlayers.map(gp => gp.player_id);
      if (playerIds.length === 0) {
        return res.status(400).json({ error: 'No players in this game' });
      }
      
      // Create expense
      const expenseId = uuidv4();
      const expenseDate = date || game.date;
      const splitAmount = amount / playerIds.length;
      
      // Auto-approve if created by admin, otherwise pending
      const status = req.user.role === 'admin' ? 'approved' : 'pending';
      
      db.run(
        `INSERT INTO expenses (id, date, category, description, amount, game_id, payer_id, split_among_all, status, created_by${status === 'approved' ? ', approved_by, approved_at' : ''}) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?${status === 'approved' ? ', ?, datetime("now")' : ''})`,
        [expenseId, expenseDate, 'Court Fee', `Court fee for ${game.location} on ${game.date}`, amount, gameId, payer_id, 1, status, req.user.id].concat(status === 'approved' ? [req.user.id] : []),
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Create splits for all players
          const stmt = db.prepare('INSERT INTO expense_splits (expense_id, player_id, amount) VALUES (?, ?, ?)');
          playerIds.forEach(pid => {
            stmt.run(expenseId, pid, splitAmount);
          });
          stmt.finalize();
          
          // Mark the payer as having paid the full amount
          db.run(
            'UPDATE game_players SET paid = 1, payment_amount = ? WHERE game_id = ? AND player_id = ?',
            [amount, gameId, payer_id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ 
                message: 'Payment recorded and expense created', 
                expense_id: expenseId,
                amount: amount,
                split_amount: splitAmount,
                splits_count: playerIds.length
              });
            }
          );
        }
      );
    });
  });
});

// ========== EXPENSES API ==========

// Get all expenses with details (protected)
app.get('/api/expenses', authenticateToken, (req, res) => {
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

// Create expense (protected)
app.post('/api/expenses', authenticateToken, (req, res) => {
  const { date, category, description, amount, game_id, payer_id, split_among_all, splits } = req.body;
  const id = uuidv4();
  
  // Auto-approve if created by admin, otherwise pending
  const status = req.user.role === 'admin' ? 'approved' : 'pending';
  
  db.run(
    `INSERT INTO expenses (id, date, category, description, amount, game_id, payer_id, split_among_all, status, created_by${status === 'approved' ? ', approved_by, approved_at' : ''}) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?${status === 'approved' ? ', ?, datetime("now")' : ''})`,
    [id, date, category, description, amount, game_id, payer_id, split_among_all ? 1 : 0, status, req.user.id].concat(status === 'approved' ? [req.user.id] : []),
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
      
      res.json({ id, date, category, description, amount, game_id, payer_id, split_among_all, status, message: status === 'pending' ? 'Expense created and pending admin approval' : 'Expense created and approved' });
    }
  );
});

// Update expense (protected)
app.put('/api/expenses/:id', authenticateToken, (req, res) => {
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

// Delete expense (protected)
app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM expense_splits WHERE expense_id = ?', [req.params.id], function(err) {
    db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Expense deleted' });
    });
  });
});

// Mark split as paid (protected)
app.put('/api/expenses/:id/payment', authenticateToken, (req, res) => {
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

// Dashboard (protected)
app.get('/api/dashboard', authenticateToken, (req, res) => {
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

// Balance sheet (protected)
app.get('/api/balances', authenticateToken, (req, res) => {
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
