const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Issue = require('../models/Issue');

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ==========================================
// 1. SPECIFIC ROUTES MUST COME FIRST
// ==========================================

// GET /api/issues/stats/summary - Get statistics
// MOVED TO TOP so it doesn't get confused with /:id
router.get('/stats/summary', async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments({});
    // Note: MongoDB matches are case-sensitive. 
    // We use regex here to be safe (e.g. 'Open' vs 'open')
    const resolvedIssues = await Issue.countDocuments({ status: { $regex: /^resolved$/i } });
    const inProgressIssues = await Issue.countDocuments({ status: { $regex: /^in_progress$/i } });
    
    // Placeholder for active volunteers if you don't have the model connected yet
    const activeVolunteers = 0; 

    res.json({
      totalIssues,
      resolvedIssues,
      inProgressIssues,
      activeVolunteers
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==========================================
// 2. GENERAL ROUTES COME NEXT
// ==========================================

// GET /api/issues - Get all issues with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search, limit = 50, offset = 0 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') }; // Case insensitive match
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    const issues = await Issue.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await Issue.countDocuments(query);
    
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

// ==========================================
// 3. DYNAMIC ID ROUTES COME LAST
// ==========================================

// GET /api/issues/:id - Get specific issue
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    // Don't log "CastError" (invalid ID format) as an error to console
    if (error.name === 'CastError') {
         return res.status(404).json({ error: 'Issue not found' });
    }
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
    
    if (!title || !description || !category || !location || !reporter_name || !reporter_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    const newIssue = new Issue({
      title,
      description,
      category,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      reporter_name,
      reporter_email,
      reporter_phone,
      photo_path,
      status: 'Open',
      updates: [{
        update_type: 'status_change',
        message: 'Issue reported and submitted for review',
        created_at: new Date()
      }]
    });

    const result = await newIssue.save();
    
    res.status(201).json({
      message: 'Issue reported successfully',
      issueId: result._id
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
    
    const updateData = { updatedAt: Date.now() };
    const updatesLog = [];

    if (status) {
      updateData.status = status;
      if (status.toLowerCase() === 'resolved') {
        updateData.resolved_at = new Date();
      }
      updatesLog.push({
        update_type: 'status_change',
        message: `Status changed to: ${status}`,
        created_at: new Date()
      });
    }
    
    if (priority) updateData.priority = priority;
    if (assigned_volunteer_id !== undefined) updateData.assigned_volunteer_id = assigned_volunteer_id;
    if (admin_notes) updateData.admin_notes = admin_notes;

    const result = await Issue.findByIdAndUpdate(
      id,
      { 
        $set: updateData,
        $push: { updates: { $each: updatesLog } } 
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json({ message: 'Issue updated successfully', issue: result });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE /api/issues/:id - Delete issue (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    if (issue.photo_path) {
      const photoPath = path.join(__dirname, '..', issue.photo_path);
      if (fs.existsSync(photoPath)) {
        try { fs.unlinkSync(photoPath); } catch(e) { console.error(e); }
      }
    }

    await Issue.findByIdAndDelete(id);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;