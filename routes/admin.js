const express = require('express');
const { authenticateToken, requireAdmin } = require('./auth');
const database = require('../database/db');

const router = express.Router();

// Initialize database connection
database.connect().then(() => {
  database.initializeTables();
});

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total issues
      database.get('SELECT COUNT(*) as count FROM issues'),
      // Issues by status
      database.get('SELECT COUNT(*) as count FROM issues WHERE status = "open"'),
      database.get('SELECT COUNT(*) as count FROM issues WHERE status = "in_progress"'),
      database.get('SELECT COUNT(*) as count FROM issues WHERE status = "resolved"'),
      // Issues by category
      database.all(`
        SELECT category, COUNT(*) as count 
        FROM issues 
        GROUP BY category 
        ORDER BY count DESC
      `),
      // Recent issues
      database.all(`
        SELECT id, title, category, status, reporter_name, created_at 
        FROM issues 
        ORDER BY created_at DESC 
        LIMIT 10
      `),
      // Total volunteers
      database.get('SELECT COUNT(*) as count FROM volunteers'),
      // Active volunteers
      database.get('SELECT COUNT(*) as count FROM volunteers WHERE status = "active"'),
      // Issues this month
      database.get(`
        SELECT COUNT(*) as count 
        FROM issues 
        WHERE created_at >= date('now', 'start of month')
      `),
      // Resolved this month
      database.get(`
        SELECT COUNT(*) as count 
        FROM issues 
        WHERE status = "resolved" 
        AND resolved_at >= date('now', 'start of month')
      `)
    ]);

    res.json({
      totalIssues: stats[0].count,
      openIssues: stats[1].count,
      inProgressIssues: stats[2].count,
      resolvedIssues: stats[3].count,
      issuesByCategory: stats[4],
      recentIssues: stats[5],
      totalVolunteers: stats[6].count,
      activeVolunteers: stats[7].count,
      issuesThisMonth: stats[8].count,
      resolvedThisMonth: stats[9].count
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
    
    let sql = `
      SELECT i.*, v.name as volunteer_name 
      FROM issues i 
      LEFT JOIN volunteers v ON i.assigned_volunteer_id = v.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }
    
    if (category && category !== 'all') {
      sql += ` AND i.category = ?`;
      params.push(category);
    }
    
    if (priority && priority !== 'all') {
      sql += ` AND i.priority = ?`;
      params.push(priority);
    }
    
    if (assigned === 'true') {
      sql += ` AND i.assigned_volunteer_id IS NOT NULL`;
    } else if (assigned === 'false') {
      sql += ` AND i.assigned_volunteer_id IS NULL`;
    }
    
    if (search) {
      sql += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ? OR i.reporter_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const issues = await database.all(sql, params);
    
    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM issues i WHERE 1=1`;
    const countParams = [];
    
    if (status && status !== 'all') {
      countSql += ` AND i.status = ?`;
      countParams.push(status);
    }
    
    if (category && category !== 'all') {
      countSql += ` AND i.category = ?`;
      countParams.push(category);
    }
    
    if (priority && priority !== 'all') {
      countSql += ` AND i.priority = ?`;
      countParams.push(priority);
    }
    
    if (assigned === 'true') {
      countSql += ` AND i.assigned_volunteer_id IS NOT NULL`;
    } else if (assigned === 'false') {
      countSql += ` AND i.assigned_volunteer_id IS NULL`;
    }
    
    if (search) {
      countSql += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ? OR i.reporter_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
    console.error('Admin issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// PUT /api/admin/issues/:id - Update issue status/assignment
router.put('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_volunteer_id, admin_notes } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'resolved') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    
    if (assigned_volunteer_id !== undefined) {
      updates.push('assigned_volunteer_id = ?');
      params.push(assigned_volunteer_id || null);
    }
    
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE issues SET ${updates.join(', ')} WHERE id = ?`;
    const result = await database.run(sql, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Add update log
    let updateMessage = 'Issue updated by admin';
    if (status) updateMessage += ` - Status: ${status}`;
    if (priority) updateMessage += ` - Priority: ${priority}`;
    if (assigned_volunteer_id) {
      const volunteer = await database.get('SELECT name FROM volunteers WHERE id = ?', [assigned_volunteer_id]);
      updateMessage += ` - Assigned to: ${volunteer ? volunteer.name : 'Unknown'}`;
    }
    
    await database.run(
      'INSERT INTO issue_updates (issue_id, user_id, update_type, message) VALUES (?, ?, ?, ?)',
      [id, req.user.id, 'admin_update', updateMessage]
    );
    
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
    
    const result = await database.run('DELETE FROM issues WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
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
    
    let sql = `
      SELECT v.*, COUNT(i.id) as assigned_issues_count
      FROM volunteers v
      LEFT JOIN issues i ON v.id = i.assigned_volunteer_id AND i.status != 'resolved'
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      sql += ` AND v.status = ?`;
      params.push(status);
    }
    
    if (skills) {
      sql += ` AND v.skills LIKE ?`;
      params.push(`%${skills}%`);
    }
    
    if (search) {
      sql += ` AND (v.name LIKE ? OR v.email LIKE ? OR v.location_preference LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    sql += ` GROUP BY v.id ORDER BY v.joined_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const volunteers = await database.all(sql, params);
    
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
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await database.run(
      'UPDATE volunteers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json({ message: 'Volunteer status updated successfully' });
  } catch (error) {
    console.error('Volunteer update error:', error);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// GET /api/admin/reports - Generate reports
router.get('/reports', async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = ' AND created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    const reports = {};
    
    if (type === 'issues' || !type) {
      // Issues report
      const issuesStats = await database.all(`
        SELECT 
          category,
          status,
          COUNT(*) as count,
          AVG(julianday(COALESCE(resolved_at, 'now')) - julianday(created_at)) as avg_resolution_days
        FROM issues 
        WHERE 1=1 ${dateFilter}
        GROUP BY category, status
        ORDER BY category, status
      `, params);
      
      reports.issues = issuesStats;
    }
    
    if (type === 'volunteers' || !type) {
      // Volunteers report
      const volunteersStats = await database.all(`
        SELECT 
          v.experience_level,
          v.status,
          COUNT(v.id) as volunteer_count,
          COUNT(i.id) as total_assigned_issues
        FROM volunteers v
        LEFT JOIN issues i ON v.id = i.assigned_volunteer_id
        GROUP BY v.experience_level, v.status
        ORDER BY v.experience_level, v.status
      `);
      
      reports.volunteers = volunteersStats;
    }
    
    res.json({ reports });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// POST /api/admin/bulk-actions - Perform bulk actions
router.post('/bulk-actions', async (req, res) => {
  try {
    const { action, issueIds } = req.body;
    
    if (!action || !issueIds || !Array.isArray(issueIds)) {
      return res.status(400).json({ error: 'Action and issue IDs are required' });
    }
    
    let sql = '';
    let params = [];
    let updateMessage = '';
    
    switch (action) {
      case 'mark_resolved':
        sql = `UPDATE issues SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${issueIds.map(() => '?').join(',')})`;
        params = issueIds;
        updateMessage = 'Bulk marked as resolved';
        break;
        
      case 'mark_in_progress':
        sql = `UPDATE issues SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id IN (${issueIds.map(() => '?').join(',')})`;
        params = issueIds;
        updateMessage = 'Bulk marked as in progress';
        break;
        
      case 'set_high_priority':
        sql = `UPDATE issues SET priority = 'high', updated_at = CURRENT_TIMESTAMP WHERE id IN (${issueIds.map(() => '?').join(',')})`;
        params = issueIds;
        updateMessage = 'Bulk set to high priority';
        break;
        
      case 'delete':
        sql = `DELETE FROM issues WHERE id IN (${issueIds.map(() => '?').join(',')})`;
        params = issueIds;
        updateMessage = 'Bulk deleted';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    const result = await database.run(sql, params);
    
    // Add update logs for affected issues (except for delete)
    if (action !== 'delete') {
      for (const issueId of issueIds) {
        await database.run(
          'INSERT INTO issue_updates (issue_id, user_id, update_type, message) VALUES (?, ?, ?, ?)',
          [issueId, req.user.id, 'bulk_action', updateMessage]
        );
      }
    }
    
    res.json({ 
      message: `Bulk action completed successfully`,
      affectedCount: result.changes 
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

module.exports = router;