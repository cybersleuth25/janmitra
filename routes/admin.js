const express = require('express');
const { authenticateToken, requireAdmin } = require('./auth');
const Issue = require('../models/Issue');
const Volunteer = require('../models/Volunteer');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Calculate start of month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const [
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        issuesByCategoryData,
        recentIssues,
        totalVolunteers,
        activeVolunteers,
        issuesThisMonth,
        resolvedThisMonth
    ] = await Promise.all([
        Issue.countDocuments({}),
        Issue.countDocuments({ status: 'open' }), // Make sure frontend sends lowercase 'open'
        Issue.countDocuments({ status: 'in_progress' }),
        Issue.countDocuments({ status: 'resolved' }),
        // Group by category
        Issue.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        // Recent issues
        Issue.find().select('title category status reporter_name createdAt').sort({ createdAt: -1 }).limit(10),
        Volunteer.countDocuments({}),
        Volunteer.countDocuments({ status: 'active' }),
        Issue.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Issue.countDocuments({ status: 'resolved', resolved_at: { $gte: startOfMonth } })
    ]);

    // Format issuesByCategory to match frontend expectation { category: "Name", count: 5 }
    const issuesByCategory = issuesByCategoryData.map(item => ({ category: item._id, count: item.count }));

    res.json({
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      issuesByCategory,
      recentIssues,
      totalVolunteers,
      activeVolunteers,
      issuesThisMonth,
      resolvedThisMonth
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/issues - Get all issues for admin view
router.get('/issues', async (req, res) => {
  try {
    const { status, category, priority, assigned, search, limit = 50, offset = 0 } = req.query;
    
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;
    
    if (assigned === 'true') {
      query.assigned_volunteer_id = { $ne: null };
    } else if (assigned === 'false') {
      query.assigned_volunteer_id = null;
    }
    
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { reporter_name: searchRegex }
      ];
    }
    
    const issues = await Issue.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));
        // Note: Mongoose does not automatically 'JOIN' (populate) unless configured. 
        // If you need volunteer names, you would use .populate('assigned_volunteer_id')
    
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
    console.error('Admin issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// PUT /api/admin/issues/:id - Update issue status/assignment
router.put('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_volunteer_id, admin_notes } = req.body;
    
    const updateData = { updatedAt: Date.now() };
    const updateLogMessage = [];

    if (status) {
        updateData.status = status;
        if (status === 'resolved') updateData.resolved_at = new Date();
        updateLogMessage.push(`Status: ${status}`);
    }
    if (priority) {
        updateData.priority = priority;
        updateLogMessage.push(`Priority: ${priority}`);
    }
    if (assigned_volunteer_id !== undefined) {
        updateData.assigned_volunteer_id = assigned_volunteer_id || null;
        updateLogMessage.push(`Assigned Volunteer ID: ${assigned_volunteer_id || 'Unassigned'}`);
    }
    if (admin_notes) updateData.admin_notes = admin_notes;

    const logEntry = {
        update_type: 'admin_update',
        message: `Issue updated by admin - ${updateLogMessage.join(' - ')}`,
        user_id: req.user.id,
        created_at: new Date()
    };

    const result = await Issue.findByIdAndUpdate(
        id,
        { 
            $set: updateData,
            $push: { updates: logEntry } 
        },
        { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json({ message: 'Issue updated successfully' });
  } catch (error) {
    console.error('Issue update error:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE /api/admin/issues/:id - Delete issue
router.delete('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByIdAndDelete(id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Note: You might want to use fs to delete the photo here if you kept that logic
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Issue deletion error:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// GET /api/admin/volunteers - Get all volunteers for admin view
router.get('/volunteers', async (req, res) => {
  try {
    const { status, skills, search, limit = 50, offset = 0 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (skills) query.skills = { $regex: skills, $options: 'i' };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { location_preference: { $regex: search, $options: 'i' } }
        ];
    }
    
    const volunteers = await Volunteer.find(query)
        .sort({ joined_at: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));
        
    // Note: Counting assigned issues for each volunteer efficiently in NoSQL 
    // usually requires a separate query or keeping a counter on the volunteer document.
    // For now, we return the volunteers.
    
    res.json({ volunteers });
  } catch (error) {
    console.error('Admin volunteers error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// PUT /api/admin/volunteers/:id - Update volunteer status
router.put('/volunteers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    const result = await Volunteer.findByIdAndUpdate(
        id, 
        { status, updated_at: Date.now() },
        { new: true }
    );
    
    if (!result) return res.status(404).json({ error: 'Volunteer not found' });
    
    res.json({ message: 'Volunteer status updated successfully' });
  } catch (error) {
    console.error('Volunteer update error:', error);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// POST /api/admin/bulk-actions
router.post('/bulk-actions', async (req, res) => {
  try {
    const { action, issueIds } = req.body;
    
    if (!action || !issueIds || !Array.isArray(issueIds)) {
      return res.status(400).json({ error: 'Action and issue IDs are required' });
    }

    let updateData = { updatedAt: new Date() };
    let message = '';

    switch (action) {
      case 'mark_resolved':
        updateData.status = 'resolved';
        updateData.resolved_at = new Date();
        message = 'Bulk marked as resolved';
        break;
      case 'mark_in_progress':
        updateData.status = 'in_progress';
        message = 'Bulk marked as in progress';
        break;
      case 'set_high_priority':
        updateData.priority = 'high';
        message = 'Bulk set to high priority';
        break;
      case 'delete':
        await Issue.deleteMany({ _id: { $in: issueIds } });
        return res.json({ message: 'Bulk deleted successfully' });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Perform bulk update
    const result = await Issue.updateMany(
        { _id: { $in: issueIds } },
        { 
            $set: updateData,
            $push: { 
                updates: {
                    update_type: 'bulk_action',
                    message: message,
                    user_id: req.user.id,
                    created_at: new Date()
                }
            }
        }
    );
    
    res.json({ 
      message: `Bulk action completed successfully`,
      affectedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

module.exports = router;