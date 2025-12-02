const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../database/db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize database connection
database.connect().then(() => {
  database.initializeTables();
});

// GET /api/issues - Get all issues with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `SELECT * FROM issues WHERE 1=1`;
    const params = [];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    if (category && category !== 'all') {
      sql += ` AND category = ?`;
      params.push(category);
    }
    
    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const issues = await database.all(sql, params);
    
    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM issues WHERE 1=1`;
    const countParams = [];
    
    if (status) {
      countSql += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (category && category !== 'all') {
      countSql += ` AND category = ?`;
      countParams.push(category);
    }
    
    if (search) {
      countSql += ` AND (title LIKE ? OR description LIKE ? OR location LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const totalResult = await database.get(countSql, countParams);
    const total = totalResult.total;
    
    res.json({
      issues,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET /api/issues/:id - Get specific issue
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await database.get('SELECT * FROM issues WHERE id = ?', [id]);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Get issue updates/comments
    const updates = await database.all(
      'SELECT * FROM issue_updates WHERE issue_id = ? ORDER BY created_at ASC',
      [id]
    );
    
    res.json({ ...issue, updates });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// POST /api/issues - Create new issue
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      reporter_name,
      reporter_email,
      reporter_phone
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !location || !reporter_name || !reporter_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await database.run(
      `INSERT INTO issues (
        title, description, category, location, latitude, longitude,
        reporter_name, reporter_email, reporter_phone, photo_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, category, location,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        reporter_name, reporter_email, reporter_phone, photo_path
      ]
    );
    
    // Add initial status update
    await database.run(
      'INSERT INTO issue_updates (issue_id, update_type, message) VALUES (?, ?, ?)',
      [result.id, 'status_change', 'Issue reported and submitted for review']
    );
    
    res.status(201).json({
      message: 'Issue reported successfully',
      issueId: result.id
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// PUT /api/issues/:id - Update issue (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_volunteer_id, admin_notes } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    
    if (assigned_volunteer_id !== undefined) {
      updates.push('assigned_volunteer_id = ?');
      params.push(assigned_volunteer_id);
    }
    
    if (admin_notes) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }
    
    if (status === 'resolved') {
      updates.push('resolved_at = CURRENT_TIMESTAMP');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE issues SET ${updates.join(', ')} WHERE id = ?`;
    const result = await database.run(sql, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Add update log
    if (status) {
      await database.run(
        'INSERT INTO issue_updates (issue_id, update_type, message) VALUES (?, ?, ?)',
        [id, 'status_change', `Status changed to: ${status}`]
      );
    }
    
    res.json({ message: 'Issue updated successfully' });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE /api/issues/:id - Delete issue (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if issue exists and get photo path
    const issue = await database.get('SELECT photo_path FROM issues WHERE id = ?', [id]);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Delete the issue (this will cascade delete related updates)
    const result = await database.run('DELETE FROM issues WHERE id = ?', [id]);
    
    // Delete associated photo file if exists
    if (issue.photo_path) {
      const photoPath = path.join(__dirname, '..', issue.photo_path);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// GET /api/issues/stats/summary - Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Promise.all([
      database.get('SELECT COUNT(*) as count FROM issues'),
      database.get('SELECT COUNT(*) as count FROM issues WHERE status = "resolved"'),
      database.get('SELECT COUNT(*) as count FROM issues WHERE status = "in_progress"'),
      database.get('SELECT COUNT(*) as count FROM volunteers WHERE status = "active"')
    ]);
    
    res.json({
      totalIssues: stats[0].count,
      resolvedIssues: stats[1].count,
      inProgressIssues: stats[2].count,
      activeVolunteers: stats[3].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;