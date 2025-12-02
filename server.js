const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const issuesRoutes = require('./routes/issues');
const volunteersRoutes = require('./routes/volunteers');
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(limiter);
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/issues', issuesRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Local Issues Reporter API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/report-issue', (req, res) => {
  res.sendFile(path.join(__dirname, 'report-issue.html'));
});

app.get('/view-issues', (req, res) => {
  res.sendFile(path.join(__dirname, 'view-issues.html'));
});

app.get('/volunteers', (req, res) => {
  res.sendFile(path.join(__dirname, 'volunteers.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/*', (req, res) => {
  const filename = req.params[0] || 'login.html';
  res.sendFile(path.join(__dirname, 'admin', filename));
});

app.get('/council/*', (req, res) => {
  const filename = req.params[0] || 'login.html';
  res.sendFile(path.join(__dirname, 'council', filename));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local Issues Reporter Server running on port ${PORT}`);
  console.log(`📝 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
  console.log(`💾 Database: SQLite (local file)`);
});

module.exports = app;