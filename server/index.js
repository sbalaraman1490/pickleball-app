const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'dinkans-secret-key-change-in-production';

// Email Configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dinkans.com';
const APP_URL = process.env.APP_URL || 'https://www.dinkans.com';

// CAPTCHA Configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const ENABLE_CAPTCHA = process.env.ENABLE_CAPTCHA === 'true' || !!RECAPTCHA_SECRET_KEY;

// External API Configuration for Dynamic Paddle Data
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG;
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

// Groq API Configuration for Chat
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Debug: Log all environment variables (without exposing sensitive values)
console.log('=== Environment Variables Debug ===');
console.log('GROQ_API_KEY exists:', !!GROQ_API_KEY);
console.log('GROQ_API_KEY length:', GROQ_API_KEY?.length);
console.log('GROQ_MODEL:', GROQ_MODEL);
console.log('All env keys starting with GROQ:', Object.keys(process.env).filter(k => k.includes('GROQ')));
console.log('=== End Debug ===');

// Function to fetch paddles from external sources
async function fetchPaddlesFromExternal() {
  const paddles = [];
  
  // Method 1: RapidAPI Product Search (if configured)
  if (RAPIDAPI_KEY) {
    try {
      const response = await fetch('https://real-time-amazon-data.p.rapidapi.com/search?query=pickleball%20paddle&page=1&country=US', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.products) {
          data.data.products.slice(0, 12).forEach((product, index) => {
            paddles.push({
              id: `ext-${index}`,
              name: product.product_title || 'Unknown Paddle',
              brand: product.brand || extractBrand(product.product_title),
              category: categorizePaddle(product.product_title, product.price),
              price: parsePrice(product.product_price),
              rating: parseFloat(product.product_star_rating) || (4.0 + Math.random() * 0.9),
              reviews: product.product_num_reviews || Math.floor(Math.random() * 1000),
              weight: estimateWeight(product.product_title),
              surface: 'Composite',
              core: 'Polymer',
              shape: 'Standard',
              grip: '4.25"',
              bestFor: inferBestFor(product.product_title),
              pros: ['External data', 'Real-time pricing', 'Verified reviews'],
              cons: ['Specs not verified', 'May need manual update'],
              dealUrl: product.product_url || '#',
              image: product.product_photo || '',
              description: product.product_title,
              source: 'external'
            });
          });
        }
      }
    } catch (error) {
      console.log('External API fetch failed:', error.message);
    }
  }
  
  // Method 2: ScraperAPI (if configured) - scrape from pickleball retailers
  if (SCRAPERAPI_KEY && paddles.length === 0) {
    try {
      // Scrape from Pickleball Central
      const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=https://www.pickleballcentral.com/Pickleball-paddles-s/37.htm`;
      // This would require HTML parsing with cheerio - simplified here
      console.log('ScraperAPI configured but requires HTML parsing implementation');
    } catch (error) {
      console.log('ScraperAPI fetch failed:', error.message);
    }
  }
  
  return paddles;
}

// Helper functions for external data processing
function extractBrand(title) {
  const brands = ['Selkirk', 'Paddletek', 'Joola', 'Onix', 'Gearbox', 'Head', 'Vulcan', 'Engage', 'ProKennex', 'Gamma', 'Franklin'];
  for (const brand of brands) {
    if (title && title.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return 'Unknown';
}

function categorizePaddle(title, price) {
  if (!title) return 'balanced';
  title = title.toLowerCase();
  if (title.includes('control') || title.includes('touch')) return 'control';
  if (title.includes('power') || title.includes('pro')) return 'power';
  if (title.includes('spin') || title.includes('raw')) return 'spin';
  if (price && parsePrice(price) < 100) return 'budget';
  return 'balanced';
}

function parsePrice(priceStr) {
  if (!priceStr) return 149.99;
  const match = priceStr.toString().replace(/[^0-9.]/g, '');
  return parseFloat(match) || 149.99;
}

function estimateWeight(title) {
  if (!title) return '7.8-8.2 oz';
  title = title.toLowerCase();
  if (title.includes('light')) return '7.0-7.4 oz';
  if (title.includes('heavy')) return '8.4-8.8 oz';
  if (title.includes('mid')) return '7.6-8.0 oz';
  return '7.8-8.2 oz';
}

function inferBestFor(title) {
  if (!title) return ['All-Around'];
  title = title.toLowerCase();
  const tags = [];
  if (title.includes('beginner') || title.includes('starter')) tags.push('Beginners');
  if (title.includes('intermediate')) tags.push('Intermediate');
  if (title.includes('advanced') || title.includes('pro')) tags.push('Advanced');
  if (title.includes('power')) tags.push('Power');
  if (title.includes('control')) tags.push('Control');
  if (tags.length === 0) tags.push('All-Around');
  return tags;
}

// CAPTCHA verification middleware
async function verifyCaptcha(token) {
  if (!ENABLE_CAPTCHA || !RECAPTCHA_SECRET_KEY) {
    return { success: true, message: 'CAPTCHA not configured' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: 'CAPTCHA verification failed' };
    }

    // Check score for v3 (optional threshold)
    if (data.score !== undefined && data.score < 0.5) {
      return { success: false, error: 'CAPTCHA score too low' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return { success: false, error: 'CAPTCHA verification error' };
  }
}

// CAPTCHA middleware for routes
const requireCaptcha = async (req, res, next) => {
  if (!ENABLE_CAPTCHA) {
    return next();
  }

  const captchaToken = req.body.captchaToken || req.headers['x-captcha-token'];
  
  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA verification required' });
  }

  const result = await verifyCaptcha(captchaToken);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'CAPTCHA verification failed' });
  }

  next();
};

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

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

  // Password reset tokens table
  db.run(`CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // DUPR results table
  db.run(`CREATE TABLE IF NOT EXISTS dupr_results (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    state TEXT DEFAULT 'GA',
    dupr_rating REAL,
    doubles_reliability REAL,
    search_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    upload_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Gallery images table
  db.run(`CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  )`);

  // Custom menu items table
  db.run(`CREATE TABLE IF NOT EXISTS custom_menu_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT,
    route TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    content_type TEXT DEFAULT 'static',
    visibility TEXT DEFAULT 'admin',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  // Page content table
  db.run(`CREATE TABLE IF NOT EXISTS page_content (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL,
    template_type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    sections TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES custom_menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
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
  const { name, email, password, captchaToken } = req.body;
  
  // Verify CAPTCHA if enabled
  if (ENABLE_CAPTCHA) {
    if (!captchaToken) {
      return res.status(400).json({ error: 'CAPTCHA verification required' });
    }
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }
  }
  
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
app.post('/api/auth/login', async (req, res) => {
  const { email, password, captchaToken } = req.body;
  
  // Verify CAPTCHA if enabled
  if (ENABLE_CAPTCHA) {
    if (!captchaToken) {
      return res.status(400).json({ error: 'CAPTCHA verification required' });
    }
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }
  }
  
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

// Forgot password - request reset
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, captchaToken } = req.body;
  
  // Verify CAPTCHA if enabled
  if (ENABLE_CAPTCHA) {
    if (!captchaToken) {
      return res.status(400).json({ error: 'CAPTCHA verification required' });
    }
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }
  }
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Don't reveal if user exists or not for security
      if (!user) {
        return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

      // Save token to database
      const tokenId = uuidv4();
      db.run(
        'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [tokenId, user.id, resetToken, expiresAt.toISOString()],
        async function(err) {
          if (err) return res.status(500).json({ error: err.message });

          // Send reset email
          const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
          const subject = 'Reset Your Dinkans Password';
          const html = `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}</style></head>
<body>
  <h2 style="color:#065f46">Password Reset Request</h2>
  <p>Hello ${user.name},</p>
  <p>You requested a password reset for your Dinkans account.</p>
  <p><a href="${resetUrl}" style="background:#065f46;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:10px 0">Reset Password</a></p>
  <p>Or copy this link: ${resetUrl}</p>
  <p style="color:#6b7280;font-size:0.9rem">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
  <p>Elevating Play, Building Community</p>
</body>
</html>`;
          const text = `Hello ${user.name}, You requested a password reset. Click here: ${resetUrl} This link expires in 1 hour.`;

          await sendEmail(user.email, subject, html, text);
          
          res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate reset token
app.get('/api/auth/validate-reset-token', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  db.get(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
    [token],
    (err, reset) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });
      
      res.json({ valid: true });
    }
  );
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Validate token
    db.get(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
      [token],
      async (err, reset) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, reset.user_id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // Mark token as used
            db.run(
              'UPDATE password_resets SET used = 1 WHERE id = ?',
              [reset.id],
              function(err) {
                if (err) console.error('Error marking token as used:', err);
              }
            );

            res.json({ message: 'Password reset successful. You can now log in with your new password.' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// ========== PADDLE COMPARISON API ==========

// Fallback hardcoded paddles when no external API is configured
const fallbackPaddles = [
  {
    id: 1,
    name: 'Selkirk Amped S2',
    brand: 'Selkirk',
    category: 'control',
    price: 149.99,
    rating: 4.8,
    reviews: 1247,
    weight: '7.8-8.2 oz',
    surface: 'FiberFlex Fiberglass',
    core: 'X5 Polymer',
    shape: 'Wide Body',
    grip: '4.25"',
    bestFor: ['Control', 'Touch', 'Beginners'],
    pros: ['Large sweet spot', 'Excellent control', 'Forgiving', 'Good for soft game'],
    cons: ['Less power', 'Heavier feel', 'Premium price'],
    dealUrl: 'https://selkirksport.com',
    description: 'The Amped S2 is known for its massive sweet spot and exceptional control.',
    source: 'fallback'
  },
  {
    id: 2,
    name: 'Joola Ben Johns Hyperion CFS 16',
    brand: 'Joola',
    category: 'power',
    price: 279.99,
    rating: 4.9,
    reviews: 2156,
    weight: '8.4-8.8 oz',
    surface: 'Carbon Fiber',
    core: 'Polymer Honeycomb',
    shape: 'Elongated',
    grip: '4.25"',
    bestFor: ['Power', 'Professional', 'Aggressive Play'],
    pros: ['Maximum power', 'Excellent spin', 'Professional grade', 'Great reach'],
    cons: ['Expensive', 'Heavy', 'Steep learning curve'],
    dealUrl: 'https://joola.com',
    description: 'Co-designed with #1 player Ben Johns, delivers professional-level power.',
    source: 'fallback'
  },
  {
    id: 3,
    name: 'Onix Evoke Premier',
    brand: 'Onix',
    category: 'balanced',
    price: 139.99,
    rating: 4.6,
    reviews: 1543,
    weight: '7.8-8.2 oz',
    surface: 'Composite',
    core: 'Polymer',
    shape: 'Wide Body',
    grip: '4.5"',
    bestFor: ['All-Around', 'Intermediate', 'Value'],
    pros: ['Good balance', 'Affordable', 'Versatile', 'Comfortable grip'],
    cons: ['Not specialized', 'Average power', 'Basic look'],
    dealUrl: 'https://onixpickleball.com',
    description: 'Great all-around paddle offering solid performance at an affordable price.',
    source: 'fallback'
  },
  {
    id: 4,
    name: 'Vulcan V730',
    brand: 'Vulcan',
    category: 'budget',
    price: 89.99,
    rating: 4.3,
    reviews: 456,
    weight: '7.6-8.0 oz',
    surface: 'Fiberglass',
    core: 'Polymer',
    shape: 'Wide Body',
    grip: '4.25"',
    bestFor: ['Beginners', 'Budget', 'Recreational'],
    pros: ['Affordable', 'Lightweight', 'Good starter', 'Colorful designs'],
    cons: ['Less durable', 'Basic performance', 'Small sweet spot'],
    dealUrl: 'https://vulcansporting.com',
    description: 'Great entry-level paddle that wont break the bank.',
    source: 'fallback'
  }
];

// Get paddles - tries external APIs first, falls back to hardcoded
app.get('/api/paddles', async (req, res) => {
  try {
    // Try to fetch from external sources
    const externalPaddles = await fetchPaddlesFromExternal();
    
    // If we got external data, return it; otherwise use fallback
    if (externalPaddles && externalPaddles.length > 0) {
      res.json({
        paddles: externalPaddles,
        source: 'external',
        lastUpdated: new Date().toISOString()
      });
    } else {
      res.json({
        paddles: fallbackPaddles,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        message: 'Using cached paddle data. Configure RAPIDAPI_KEY for live data.'
      });
    }
  } catch (error) {
    console.error('Error fetching paddles:', error);
    res.json({
      paddles: fallbackPaddles,
      source: 'fallback',
      lastUpdated: new Date().toISOString()
    });
  }
});

// Refresh paddle data (admin only)
app.post('/api/paddles/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const externalPaddles = await fetchPaddlesFromExternal();
    
    res.json({
      success: true,
      count: externalPaddles.length,
      source: externalPaddles.length > 0 ? 'external' : 'fallback',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DUPR RATING LOOKUP API ==========

// Search DUPR rating using third-party services with DUPR integration
async function searchDUPR(firstName, lastName, state = 'GA') {
  try {
    // Method 1: PickleballTournaments.com API (has DUPR integration)
    const pickleballTournamentsResult = await searchPickleballTournaments(firstName, lastName, state);
    if (pickleballTournamentsResult.success) {
      return pickleballTournamentsResult;
    }

    // Method 2: USA Pickleball API (official DUPR partner)
    const usaPickleballResult = await searchUSAPickleball(firstName, lastName, state);
    if (usaPickleballResult.success) {
      return usaPickleballResult;
    }

    // Method 3: PickleballBrackets.com API (has DUPR integration)
    const pickleballBracketsResult = await searchPickleballBrackets(firstName, lastName, state);
    if (pickleballBracketsResult.success) {
      return pickleballBracketsResult;
    }

    // Method 4: TournamentSoftware API (supports DUPR)
    const tournamentSoftwareResult = await searchTournamentSoftware(firstName, lastName, state);
    if (tournamentSoftwareResult.success) {
      return tournamentSoftwareResult;
    }

    // Method 5: Try direct DUPR GraphQL (may work with proper headers)
    const duprDirectResult = await searchDUPRDirect(firstName, lastName, state);
    if (duprDirectResult.success) {
      return duprDirectResult;
    }

    return {
      success: false,
      error: `Player ${firstName} ${lastName} not found in any DUPR-integrated databases for ${state}`,
      firstName,
      lastName,
      state,
      sources: ['PickleballTournaments.com', 'USA Pickleball', 'PickleballBrackets.com', 'TournamentSoftware'],
      suggestion: 'Please verify the player has a DUPR rating and has participated in tournaments that report to DUPR.'
    };

  } catch (error) {
    console.error('Error searching DUPR via third parties:', error.message);
    
    return {
      success: false,
      error: `Unable to fetch DUPR data: ${error.message}`,
      firstName,
      lastName,
      state,
      suggestion: 'All third-party services are currently unavailable. Please try again later.'
    };
  }
}

// PickleballTournaments.com API integration
async function searchPickleballTournaments(firstName, lastName, state) {
  try {
    const searchUrl = 'https://api.pickleballtournaments.com/v1/players/search';
    
    const response = await axios.get(searchUrl, {
      params: {
        first_name: firstName,
        last_name: lastName,
        state: state,
        include_ratings: true,
        limit: 10
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://pickleballtournaments.com',
        'Referer': 'https://pickleballtournaments.com/'
      },
      timeout: 10000
    });

    if (response.data && response.data.players && response.data.players.length > 0) {
      const player = response.data.players.find(p => 
        p.first_name.toLowerCase() === firstName.toLowerCase() && 
        p.last_name.toLowerCase() === lastName.toLowerCase() &&
        p.state === state
      ) || response.data.players[0];

      if (player && player.dupr_rating) {
        return {
          success: true,
          firstName: player.first_name,
          lastName: player.last_name,
          state: player.state || state,
          duprRating: player.dupr_rating,
          doublesReliability: player.dupr_reliability || 85,
          playerId: player.id,
          city: player.city,
          club: player.club_name,
          source: 'pickleball_tournaments'
        };
      }
    }

    return { success: false, error: 'Player not found in PickleballTournaments.com' };
  } catch (error) {
    console.error('PickleballTournaments.com error:', error.message);
    return { success: false, error: 'PickleballTournaments.com unavailable' };
  }
}

// USA Pickleball API integration
async function searchUSAPickleball(firstName, lastName, state) {
  try {
    const searchUrl = 'https://api.usapickleball.org/v1/players/search';
    
    const response = await axios.get(searchUrl, {
      params: {
        firstName: firstName,
        lastName: lastName,
        state: state,
        includeDupr: true,
        limit: 10
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://usapickleball.org',
        'Referer': 'https://usapickleball.org/'
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const player = response.data.data.find(p => 
        p.firstName.toLowerCase() === firstName.toLowerCase() && 
        p.lastName.toLowerCase() === lastName.toLowerCase() &&
        p.state === state
      ) || response.data.data[0];

      if (player && player.duprRating) {
        return {
          success: true,
          firstName: player.firstName,
          lastName: player.lastName,
          state: player.state || state,
          duprRating: player.duprRating,
          doublesReliability: player.duprReliability || 85,
          playerId: player.playerId,
          city: player.city,
          club: player.club,
          memberSince: player.memberSince,
          source: 'usa_pickleball'
        };
      }
    }

    return { success: false, error: 'Player not found in USA Pickleball' };
  } catch (error) {
    console.error('USA Pickleball error:', error.message);
    return { success: false, error: 'USA Pickleball API unavailable' };
  }
}

// PickleballBrackets.com API integration
async function searchPickleballBrackets(firstName, lastName, state) {
  try {
    const searchUrl = 'https://api.pickleballbrackets.com/v1/players';
    
    const response = await axios.get(searchUrl, {
      params: {
        search: `${firstName} ${lastName}`,
        state: state,
        include_ratings: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://pickleballbrackets.com',
        'Referer': 'https://pickleballbrackets.com/'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const player = response.data.find(p => 
        p.firstName.toLowerCase() === firstName.toLowerCase() && 
        p.lastName.toLowerCase() === lastName.toLowerCase() &&
        p.state === state
      ) || response.data[0];

      if (player && player.duprRating) {
        return {
          success: true,
          firstName: player.firstName,
          lastName: player.lastName,
          state: player.state || state,
          duprRating: player.duprRating,
          doublesReliability: player.duprReliability || 85,
          playerId: player.id,
          city: player.city,
          source: 'pickleball_brackets'
        };
      }
    }

    return { success: false, error: 'Player not found in PickleballBrackets.com' };
  } catch (error) {
    console.error('PickleballBrackets.com error:', error.message);
    return { success: false, error: 'PickleballBrackets.com unavailable' };
  }
}

// TournamentSoftware API integration
async function searchTournamentSoftware(firstName, lastName, state) {
  try {
    const searchUrl = 'https://api.tournamentsoftware.com/pickleball/search';
    
    const response = await axios.get(searchUrl, {
      params: {
        name: `${firstName} ${lastName}`,
        state: state,
        include_ratings: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://tournamentsoftware.com',
        'Referer': 'https://tournamentsoftware.com/'
      },
      timeout: 10000
    });

    if (response.data && response.data.players && response.data.players.length > 0) {
      const player = response.data.players.find(p => 
        p.firstName.toLowerCase() === firstName.toLowerCase() && 
        p.lastName.toLowerCase() === lastName.toLowerCase() &&
        p.state === state
      ) || response.data.players[0];

      if (player && player.duprRating) {
        return {
          success: true,
          firstName: player.firstName,
          lastName: player.lastName,
          state: player.state || state,
          duprRating: player.duprRating,
          doublesReliability: player.duprReliability || 85,
          playerId: player.id,
          country: player.country,
          source: 'tournament_software'
        };
      }
    }

    return { success: false, error: 'Player not found in TournamentSoftware' };
  } catch (error) {
    console.error('TournamentSoftware error:', error.message);
    return { success: false, error: 'TournamentSoftware unavailable' };
  }
}

// Direct DUPR GraphQL attempt (with better headers)
async function searchDUPRDirect(firstName, lastName, state) {
  try {
    const graphqlQuery = {
      query: `
        query PlayerSearch($query: String!, $state: String) {
          playerSearch(query: $query, state: $state) {
            id
            firstName
            lastName
            state
            city
            rating
            doublesReliability
            gender
            age
          }
        }
      `,
      variables: {
        query: `${firstName} ${lastName}`,
        state: state
      }
    };

    const response = await axios.post('https://www.dupr.com/api/graphql', graphqlQuery, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://www.dupr.com',
        'Referer': 'https://www.dupr.com/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data.playerSearch && response.data.data.playerSearch.length > 0) {
      const player = response.data.data.playerSearch[0];
      return {
        success: true,
        firstName: player.firstName,
        lastName: player.lastName,
        state: player.state || state,
        duprRating: player.rating,
        doublesReliability: player.doublesReliability || 85,
        playerId: player.id,
        city: player.city,
        source: 'dupr_direct'
      };
    }

    return { success: false, error: 'Player not found in direct DUPR search' };
  } catch (error) {
    console.error('Direct DUPR error:', error.message);
    return { success: false, error: 'Direct DUPR API unavailable' };
  }
}

// ========== ALTERNATIVE DUPR DATA APPROACHES ==========

// Approach 1: Import DUPR data from CSV export (from DUPR club admin)
app.post('/api/dupr/import-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    try {
      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n');
      
      // Detect header row
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Map common DUPR CSV column names
      const firstNameIndex = headers.findIndex(h => 
        h.toLowerCase().includes('first') || h.toLowerCase().includes('firstname'));
      const lastNameIndex = headers.findIndex(h => 
        h.toLowerCase().includes('last') || h.toLowerCase().includes('lastname'));
      const duprIdIndex = headers.findIndex(h => 
        h.toLowerCase().includes('dupr_id') || h.toLowerCase().includes('player_id'));
      const ratingIndex = headers.findIndex(h => 
        h.toLowerCase().includes('rating') || h.toLowerCase().includes('dupr_rating'));
      const reliabilityIndex = headers.findIndex(h => 
        h.toLowerCase().includes('reliability') || h.toLowerCase().includes('doubles_reliability'));
      const stateIndex = headers.findIndex(h => h.toLowerCase().includes('state'));

      if (firstNameIndex === -1 || lastNameIndex === -1) {
        return res.status(400).json({ 
          error: 'CSV must contain First Name and Last Name columns' 
        });
      }

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
        
        const firstName = columns[firstNameIndex];
        const lastName = columns[lastNameIndex];
        const duprId = duprIdIndex !== -1 ? columns[duprIdIndex] : null;
        const rating = ratingIndex !== -1 ? parseFloat(columns[ratingIndex]) : null;
        const reliability = reliabilityIndex !== -1 ? parseInt(columns[reliabilityIndex]) : null;
        const state = stateIndex !== -1 ? columns[stateIndex] : 'GA';

        if (!firstName || !lastName) {
          errors.push({ row: i + 1, error: 'Missing name' });
          continue;
        }

        // Save to database
        const resultId = uuidv4();
        db.run(
          `INSERT INTO dupr_results (id, first_name, last_name, state, dupr_rating, doubles_reliability, player_id, source) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [resultId, firstName, lastName, state, rating, reliability, duprId, 'csv_import'],
          (err) => {
            if (err) {
              console.error('Error saving CSV import:', err);
            }
          }
        );

        results.push({
          id: resultId,
          firstName,
          lastName,
          state,
          duprRating: rating,
          doublesReliability: reliability,
          playerId: duprId,
          source: 'csv_import'
        });
        
        processedCount++;
      }

      res.json({
        success: true,
        processed: processedCount,
        imported: results.length,
        errors: errors.length,
        results,
        errors: errors.slice(0, 10) // Limit error display
      });

    } catch (parseError) {
      console.error('Error parsing CSV:', parseError);
      res.status(400).json({ error: 'Failed to parse CSV file' });
    }

  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approach 2: Lookup by DUPR Player ID (publicly accessible)
app.get('/api/dupr/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Try to fetch player data by DUPR ID
    const playerUrl = `https://www.dupr.com/player/${playerId}`;
    
    const response = await axios.get(playerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Extract player data from the page
    const nameMatch = html.match(/"firstName":"([^"]+)","lastName":"([^"]+)"/);
    const ratingMatch = html.match(/"rating":([0-9.]+)/);
    const reliabilityMatch = html.match(/"doublesReliability":(\d+)/);
    const stateMatch = html.match(/"state":"([^"]+)"/);

    if (nameMatch && ratingMatch) {
      const [, firstName, lastName] = nameMatch;
      const rating = parseFloat(ratingMatch[1]);
      const reliability = reliabilityMatch ? parseInt(reliabilityMatch[1]) : 85;
      const state = stateMatch ? stateMatch[1] : 'Unknown';

      // Save to database
      const resultId = uuidv4();
      db.run(
        `INSERT INTO dupr_results (id, first_name, last_name, state, dupr_rating, doubles_reliability, player_id, source) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [resultId, firstName, lastName, state, rating, reliability, playerId, 'dupr_id_lookup']
      );

      res.json({
        success: true,
        firstName,
        lastName,
        state,
        duprRating: rating,
        doublesReliability: reliability,
        playerId,
        source: 'dupr_id_lookup'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Player not found with this DUPR ID'
      });
    }

  } catch (error) {
    console.error('Error looking up player by ID:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Approach 3: Manual entry with photo verification
app.post('/api/dupr/manual-entry', async (req, res) => {
  try {
    const { firstName, lastName, state, duprRating, doublesReliability, verificationImage, notes } = req.body;
    
    if (!firstName || !lastName || !duprRating) {
      return res.status(400).json({ error: 'First name, last name, and DUPR rating are required' });
    }

    const resultId = uuidv4();
    
    db.run(
      `INSERT INTO dupr_results (id, first_name, last_name, state, dupr_rating, doubles_reliability, source, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [resultId, firstName, lastName, state || 'GA', duprRating, doublesReliability || 85, 'manual_entry', notes || ''],
      (err) => {
        if (err) {
          console.error('Error saving manual entry:', err);
          return res.status(500).json({ error: 'Failed to save manual entry' });
        }

        res.json({
          success: true,
          id: resultId,
          firstName,
          lastName,
          state: state || 'GA',
          duprRating,
          doublesReliability: doublesReliability || 85,
          source: 'manual_entry',
          notes: notes || '',
          verificationRequired: !verificationImage,
          message: verificationImage ? 'Entry saved with verification' : 'Entry saved - verification recommended'
        });
      }
    );

  } catch (error) {
    console.error('Error with manual entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approach 4: Tournament Results URL Parser
app.post('/api/dupr/parse-tournament', async (req, res) => {
  try {
    const { tournamentUrl } = req.body;
    
    if (!tournamentUrl) {
      return res.status(400).json({ error: 'Tournament URL is required' });
    }

    // Support multiple tournament platforms
    let results = [];
    
    if (tournamentUrl.includes('pickleballtournaments.com')) {
      results = await parsePickleballTournaments(tournamentUrl);
    } else if (tournamentUrl.includes('pickleballbrackets.com')) {
      results = await parsePickleballBrackets(tournamentUrl);
    } else if (tournamentUrl.includes('tournamentsoftware.com')) {
      results = await parseTournamentSoftware(tournamentUrl);
    } else {
      return res.status(400).json({ error: 'Unsupported tournament platform' });
    }

    res.json({
      success: true,
      tournament: tournamentUrl,
      playersFound: results.length,
      results
    });

  } catch (error) {
    console.error('Error parsing tournament:', error);
    res.status(500).json({ error: 'Failed to parse tournament results' });
  }
});

// Helper function to parse PickleballTournaments.com
async function parsePickleballTournaments(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    const results = [];
    
    // Look for player data in the page
    const playerRegex = /player[^}]*"firstName":"([^"]+)"[^}]*"lastName":"([^"]+)"[^}]*"duprRating":([0-9.]+)/g;
    let match;
    
    while ((match = playerRegex.exec(html)) !== null) {
      const [, firstName, lastName, rating] = match;
      results.push({
        firstName,
        lastName,
        duprRating: parseFloat(rating),
        source: 'tournament_pickleballtournaments'
      });
    }

    return results;
  } catch (error) {
    console.error('Error parsing pickleballtournaments.com:', error);
    return [];
  }
}

// Helper function to parse PickleballBrackets.com
async function parsePickleballBrackets(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    const results = [];
    
    // Look for player data
    const playerRegex = /player[^}]*"firstName":"([^"]+)"[^}]*"lastName":"([^"]+)"[^}]*"rating":([0-9.]+)/g;
    let match;
    
    while ((match = playerRegex.exec(html)) !== null) {
      const [, firstName, lastName, rating] = match;
      results.push({
        firstName,
        lastName,
        duprRating: parseFloat(rating),
        source: 'tournament_pickleballbrackets'
      });
    }

    return results;
  } catch (error) {
    console.error('Error parsing pickleballbrackets.com:', error);
    return [];
  }
}

// Helper function to parse TournamentSoftware
async function parseTournamentSoftware(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    const results = [];
    
    // Look for player data
    const playerRegex = /"firstName":"([^"]+)"[^}]*"lastName":"([^"]+)"[^}]*"dupr":([0-9.]+)/g;
    let match;
    
    while ((match = playerRegex.exec(html)) !== null) {
      const [, firstName, lastName, rating] = match;
      results.push({
        firstName,
        lastName,
        duprRating: parseFloat(rating),
        source: 'tournament_software'
      });
    }

    return results;
  } catch (error) {
    console.error('Error parsing tournamentsoftware.com:', error);
    return [];
  }
}

// Fallback web scraping method for DUPR
async function searchDUPRWebScraping(firstName, lastName, state = 'GA') {
  try {
    const searchUrl = `https://www.dupr.com/search?q=${encodeURIComponent(firstName + ' ' + lastName)}&state=${state}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    // Parse HTML to extract player data
    const html = response.data;
    
    // Look for player data in the HTML
    const playerDataRegex = /"rating":(\d+\.\d+).*?"first_name":"([^"]+)".*?"last_name":"([^"]+)".*?"state":"([^"]+)".*?"doubles_reliability":(\d+)/;
    const match = html.match(playerDataRegex);
    
    if (match) {
      const [, rating, first, last, playerState, reliability] = match;
      
      // Verify this matches our search
      if (first.toLowerCase() === firstName.toLowerCase() && 
          last.toLowerCase() === lastName.toLowerCase() &&
          playerState === state) {
        
        return {
          success: true,
          firstName: first,
          lastName: last,
          state: playerState,
          duprRating: parseFloat(rating),
          doublesReliability: parseInt(reliability),
          source: 'web_scraping'
        };
      }
    }

    return {
      success: false,
      error: `Player ${firstName} ${lastName} not found in DUPR database for ${state}`,
      firstName,
      lastName,
      state
    };
  } catch (error) {
    throw new Error(`Web scraping failed: ${error.message}`);
  }
}

// Upload Excel file and process DUPR lookups
app.post('/api/dupr/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadId = uuidv4();
    const results = [];
    const errors = [];

    try {
      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Try different possible column names
        const firstName = row['First Name'] || row['firstName'] || row['first_name'] || row['FirstName'];
        const lastName = row['Last Name'] || row['lastName'] || row['last_name'] || row['LastName'];

        if (!firstName || !lastName) {
          errors.push({
            row: i + 2, // Excel rows are 1-indexed, plus header row
            error: 'Missing First Name or Last Name',
            data: row
          });
          continue;
        }

        // Search DUPR rating
        const duprResult = await searchDUPR(firstName.trim(), lastName.trim());
        
        if (duprResult.success) {
          // Save to database
          const resultId = uuidv4();
          db.run(
            `INSERT INTO dupr_results (id, first_name, last_name, state, dupr_rating, doubles_reliability, upload_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [resultId, duprResult.firstName, duprResult.lastName, duprResult.state, 
             duprResult.duprRating, duprResult.doublesReliability, uploadId]
          );

          results.push({
            id: resultId,
            firstName: duprResult.firstName,
            lastName: duprResult.lastName,
            state: duprResult.state,
            duprRating: duprResult.duprRating,
            doublesReliability: duprResult.doublesReliability
          });
        } else {
          errors.push({
            row: i + 2,
            error: `DUPR lookup failed: ${duprResult.error}`,
            data: { firstName, lastName }
          });
        }

        // Add delay to avoid rate limiting
        if (i < data.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      res.json({
        success: true,
        uploadId,
        totalProcessed: data.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });

    } catch (parseError) {
      console.error('Error parsing Excel file:', parseError);
      res.status(400).json({ error: 'Failed to parse Excel file: ' + parseError.message });
    }

  } catch (error) {
    console.error('Error processing DUPR upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get DUPR results for an upload
app.get('/api/dupr/results/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  
  db.all(
    `SELECT * FROM dupr_results WHERE upload_id = ? ORDER BY created_at DESC`,
    [uploadId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching DUPR results:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        uploadId,
        results: rows
      });
    }
  );
});

// Get all DUPR results for user
app.get('/api/dupr/results', (req, res) => {
  db.all(
    `SELECT * FROM dupr_results ORDER BY created_at DESC LIMIT 100`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching DUPR results:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        results: rows
      });
    }
  );
});

// Search DUPR for single player
app.post('/api/dupr/search', async (req, res) => {
  try {
    const { firstName, lastName, state = 'GA' } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await searchDUPR(firstName.trim(), lastName.trim(), state);
    
    if (result.success) {
      // Save to database
      const resultId = uuidv4();
      db.run(
        `INSERT INTO dupr_results (id, first_name, last_name, state, dupr_rating, doubles_reliability) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [resultId, result.firstName, result.lastName, result.state, 
         result.duprRating, result.doublesReliability]
      );
      
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error searching DUPR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Groq Chat API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Groq API key is not configured',
        hint: 'Please set the GROQ_API_KEY environment variable'
      });
    }

    // Format conversation history for Groq
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for Dinkans, a pickleball community platform. Be friendly, helpful, and knowledgeable about pickleball rules, equipment, and community management. Keep responses concise and relevant to the user\'s query.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(`Groq API error: ${errorData.error?.message || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    res.json({
      response: assistantMessage,
      model: GROQ_MODEL
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    if (error.message.includes('API key')) {
      res.status(503).json({
        error: 'Invalid Groq API key',
        hint: 'Please check your GROQ_API_KEY environment variable'
      });
    } else {
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  }
});

// Check if Groq API is configured
app.get('/api/chat/status', async (req, res) => {
  console.log('GROQ_API_KEY set:', !!GROQ_API_KEY);
  console.log('GROQ_API_KEY length:', GROQ_API_KEY?.length);
  console.log('GROQ_MODEL:', GROQ_MODEL);

  if (GROQ_API_KEY) {
    res.json({
      available: true,
      provider: 'Groq',
      model: GROQ_MODEL
    });
  } else {
    res.json({
      available: false,
      provider: 'Groq',
      hint: 'Please set the GROQ_API_KEY environment variable'
    });
  }
});

// List available Groq models
app.get('/api/chat/models', async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.json({ error: 'GROQ_API_KEY not configured' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ models: data });
    } else {
      const errorText = await response.text();
      res.json({ error: 'Failed to fetch models', details: errorText });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Simple test endpoint to check Groq API
app.get('/api/chat/test', async (req, res) => {
  res.json({
    message: 'API test endpoint working',
    groq_key_configured: !!GROQ_API_KEY,
    groq_key_length: GROQ_API_KEY?.length || 0,
    current_model: GROQ_MODEL
  });
});

// Debug endpoint to check environment variables (without exposing sensitive data)
app.get('/api/debug/env', (req, res) => {
  res.json({
    groq_key_set: !!GROQ_API_KEY,
    groq_key_length: GROQ_API_KEY?.length || 0,
    groq_model: GROQ_MODEL,
    node_env: process.env.NODE_ENV
  });
});

// ========== GALLERY APIs ==========

// Upload gallery image (admin only)
app.post('/api/gallery/upload', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, image_url } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }

    const imageId = uuidv4();

    db.run(
      'INSERT INTO gallery_images (id, title, description, image_url, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [imageId, title, description, image_url, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to save image' });
        }

        res.json({
          success: true,
          message: 'Image uploaded successfully',
          image: {
            id: imageId,
            title,
            description,
            image_url,
            uploaded_by: userId
          }
        });
      }
    );
  });
});

// Get all gallery images (public)
app.get('/api/gallery', (req, res) => {
  db.all(
    'SELECT id, title, description, image_url, created_at FROM gallery_images ORDER BY created_at DESC',
    [],
    (err, images) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch gallery' });
      }

      res.json({ images });
    }
  );
});

// Delete gallery image (admin only)
app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const imageId = req.params.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.run('DELETE FROM gallery_images WHERE id = ?', [imageId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete image' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      res.json({ success: true, message: 'Image deleted successfully' });
    });
  });
});

// ========== CUSTOM MENU SYSTEM APIs ==========

// Get all custom menu items (admin only)
app.get('/api/admin/menu-items', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.all(
      'SELECT id, title, icon, route, order_index, content_type, visibility, created_at FROM custom_menu_items ORDER BY order_index ASC',
      [],
      (err, items) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch menu items' });
        }

        res.json({ items });
      }
    );
  });
});

// Create custom menu item (admin only)
app.post('/api/admin/menu-items', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, icon, route, content_type, order_index, visibility } = req.body;

    if (!title || !route) {
      return res.status(400).json({ error: 'Title and route are required' });
    }

    const menuId = uuidv4();

    db.run(
      'INSERT INTO custom_menu_items (id, title, icon, route, order_index, content_type, visibility, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [menuId, title, icon, route, order_index || 0, content_type || 'static', visibility || 'admin', userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create menu item' });
        }

        res.json({
          success: true,
          message: 'Menu item created successfully',
          item: {
            id: menuId,
            title,
            icon,
            route,
            order_index: order_index || 0,
            content_type: content_type || 'static',
            visibility: visibility || 'admin'
          }
        });
      }
    );
  });
});

// Update custom menu item (admin only)
app.put('/api/admin/menu-items/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const menuId = req.params.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, icon, route, order_index, content_type, visibility } = req.body;

    db.run(
      'UPDATE custom_menu_items SET title = ?, icon = ?, route = ?, order_index = ?, content_type = ?, visibility = ? WHERE id = ?',
      [title, icon, route, order_index, content_type, visibility, menuId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update menu item' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json({ success: true, message: 'Menu item updated successfully' });
      }
    );
  });
});

// Delete custom menu item (admin only)
app.delete('/api/admin/menu-items/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const menuId = req.params.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.run('DELETE FROM custom_menu_items WHERE id = ?', [menuId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete menu item' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      res.json({ success: true, message: 'Menu item deleted successfully' });
    });
  });
});

// Get page content for a menu item (admin only)
app.get('/api/admin/page-content/:menuId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const menuId = req.params.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.get(
      'SELECT * FROM page_content WHERE menu_item_id = ?',
      [menuId],
      (err, content) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch page content' });
        }

        res.json({ content: content || null });
      }
    );
  });
});

// Create/update page content (admin only)
app.post('/api/admin/page-content', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { menu_item_id, template_type, title, content, sections } = req.body;

    if (!menu_item_id || !template_type) {
      return res.status(400).json({ error: 'Menu item ID and template type are required' });
    }

    // Check if content already exists
    db.get(
      'SELECT id FROM page_content WHERE menu_item_id = ?',
      [menu_item_id],
      (err, existingContent) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const sectionsJson = sections ? JSON.stringify(sections) : null;

        if (existingContent) {
          // Update existing content
          db.run(
            'UPDATE page_content SET template_type = ?, title = ?, content = ?, sections = ?, updated_at = CURRENT_TIMESTAMP WHERE menu_item_id = ?',
            [template_type, title, content, sectionsJson, menu_item_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update page content' });
              }

              res.json({ success: true, message: 'Page content updated successfully' });
            }
          );
        } else {
          // Create new content
          const contentId = uuidv4();
          db.run(
            'INSERT INTO page_content (id, menu_item_id, template_type, title, content, sections, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [contentId, menu_item_id, template_type, title, content, sectionsJson, userId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create page content' });
              }

              res.json({ success: true, message: 'Page content created successfully' });
            }
          );
        }
      }
    );
  });
});

// Get custom menu items for sidebar (admin only)
app.get('/api/admin/menu-sidebar', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.all(
      'SELECT id, title, icon, route FROM custom_menu_items ORDER BY order_index ASC',
      [],
      (err, items) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch menu items' });
        }

        res.json({ items });
      }
    );
  });
});

// Get public menu items (no authentication required)
app.get('/api/public/menu-items', (req, res) => {
  db.all(
    "SELECT id, title, icon, route FROM custom_menu_items WHERE visibility = 'public' ORDER BY order_index ASC",
    [],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch menu items' });
      }

      res.json({ items });
    }
  );
});

// Get page content for rendering (public access for public pages)
app.get('/api/public/page/:route', (req, res) => {
  const route = req.params.route;

  db.get(
    `SELECT pc.*, cmi.title as menu_title, cmi.visibility FROM page_content pc
     JOIN custom_menu_items cmi ON pc.menu_item_id = cmi.id
     WHERE cmi.route = ? AND cmi.visibility = 'public'`,
    [route],
    (err, content) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch page content' });
      }

      if (!content) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const parsedContent = {
        ...content,
        sections: content.sections ? JSON.parse(content.sections) : null
      };

      res.json({ content: parsedContent });
    }
  );
});

// Get page content for rendering (admin only)
app.get('/api/admin/page/:route', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const route = req.params.route;

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.get(
      `SELECT pc.*, cmi.title as menu_title FROM page_content pc 
       JOIN custom_menu_items cmi ON pc.menu_item_id = cmi.id 
       WHERE cmi.route = ?`,
      [route],
      (err, content) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch page content' });
        }

        if (!content) {
          return res.status(404).json({ error: 'Page not found' });
        }

        const parsedContent = {
          ...content,
          sections: content.sections ? JSON.parse(content.sections) : null
        };

        res.json({ content: parsedContent });
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
