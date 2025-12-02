const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize database connection
database.connect().then(() => {
  database.initializeTables();
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await database.get(
      'SELECT * FROM users WHERE username = ? AND role = ?',
      [username, role]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Store session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await database.run(
      'INSERT INTO admin_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt.toISOString()]
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register - Register new user (admin only)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'admin', full_name, phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if username already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, role, full_name, phone]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Remove session from database
      await database.run(
        'DELETE FROM admin_sessions WHERE session_token = ?',
        [token]
      );
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists in database
    const session = await database.get(
      'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    
    // Get user details
    const user = await database.get(
      'SELECT id, username, email, role, full_name FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      valid: true,
      user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Middleware to authenticate requests
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists
    const session = await database.get(
      'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'council')) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Get user
    const user = await database.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await database.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = {
  router,
  authenticateToken,
  requireAdmin
};