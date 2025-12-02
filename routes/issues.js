const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Issue = require('../models/Issue'); // Import the Mongoose model
// const Volunteer = require('../models/Volunteer'); // Uncomment if you need to check volunteers

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

// GET /api/issues - Get all issues with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search, limit = 50, offset = 0 } = req.query;
    
    // Build query object
    const query = {};
    
    if (status) {
      query.status = status;
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
    
    // Fetch issues from MongoDB
    const issues = await Issue.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Get total count
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

// GET /api/issues/:id - Get specific issue
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // In MongoDB, we typically store updates inside the issue document or populate them.
    // Assuming 'updates' is an array in the Issue model (if not, add it to your schema)
    // If you haven't added it, this will just return the issue data.
    res.json(issue);
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
    
    // Create new Issue document
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
      // Add initial update log if your Schema supports an 'updates' array
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
      if (status === 'resolved') {
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

    // Use $set for fields and $push for the updates array
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
    
    // Delete associated photo file if exists
    if (issue.photo_path) {
      const photoPath = path.join(__dirname, '..', issue.photo_path);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
        } catch(e) {
          console.error("Could not delete file:", e);
        }
      }
    }

    await Issue.findByIdAndDelete(id);
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// GET /api/issues/stats/summary - Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments({});
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' }); // Ensure status matches your DB (case sensitive)
    const inProgressIssues = await Issue.countDocuments({ status: 'in_progress' });
    
    // If you have a Volunteer model, uncomment below:
    // const activeVolunteers = await Volunteer.countDocuments({ status: 'active' });
    const activeVolunteers = 0; // Placeholder until Volunteer model is connected

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

module.exports = router;