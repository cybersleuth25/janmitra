const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'local_issues.db');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Execute a query that returns multiple rows
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Execute a query that returns a single row
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Execute a query that modifies data (INSERT, UPDATE, DELETE)
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // Initialize database tables
  async initializeTables() {
    const tables = [
      // Users table for authentication
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        full_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Issues table
      `CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        reporter_name TEXT NOT NULL,
        reporter_email TEXT NOT NULL,
        reporter_phone TEXT,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        photo_path TEXT,
        assigned_volunteer_id INTEGER,
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (assigned_volunteer_id) REFERENCES volunteers (id)
      )`,

      // Volunteers table
      `CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        skills TEXT,
        availability TEXT,
        location_preference TEXT,
        experience_level TEXT DEFAULT 'beginner',
        status TEXT DEFAULT 'active',
        bio TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Issue comments/updates table
      `CREATE TABLE IF NOT EXISTS issue_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER NOT NULL,
        user_id INTEGER,
        update_type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Admin sessions table
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    ];

    try {
      for (const table of tables) {
        await this.run(table);
      }
      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }
}

// Create and export database instance
const database = new Database();

module.exports = database;