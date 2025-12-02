const bcrypt = require('bcrypt');
const database = require('../database/db');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to database
    await database.connect();
    
    // Initialize tables
    await database.initializeTables();
    
    // Check if data already exists
    const existingUsers = await database.get('SELECT COUNT(*) as count FROM users');
    if (existingUsers.count > 0) {
      console.log('✅ Database already initialized with data');
      return;
    }
    
    console.log('📝 Adding sample data...');
    
    // Create admin users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const councilPassword = await bcrypt.hash('council123', 10);
    
    await database.run(`
      INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES 
      ('admin', 'admin@localissues.com', ?, 'admin', 'System Administrator', '+1234567890'),
      ('council', 'council@localgovernment.com', ?, 'council', 'Council Manager', '+1234567891')
    `, [adminPassword, councilPassword]);
    
    // Create sample volunteers
    const sampleVolunteers = [
      {
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1234567801',
        skills: 'Road maintenance, Construction',
        availability: 'Weekends, Evenings',
        location_preference: 'Downtown area',
        experience_level: 'intermediate',
        bio: 'Experienced in road work and general maintenance. Happy to help improve our community infrastructure.'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1234567802',
        skills: 'Electrical work, Street lighting',
        availability: 'Weekdays',
        location_preference: 'Residential areas',
        experience_level: 'advanced',
        bio: 'Licensed electrician with 10+ years experience. Specialized in street lighting and electrical issues.'
      },
      {
        name: 'Mike Davis',
        email: 'mike.davis@email.com',
        phone: '+1234567803',
        skills: 'Plumbing, Water systems',
        availability: 'Flexible',
        location_preference: 'City-wide',
        experience_level: 'advanced',
        bio: 'Professional plumber available for water supply and drainage issues throughout the city.'
      },
      {
        name: 'Emily Chen',
        email: 'emily.chen@email.com',
        phone: '+1234567804',
        skills: 'Environmental cleanup, Waste management',
        availability: 'Weekends',
        location_preference: 'Parks and public spaces',
        experience_level: 'beginner',
        bio: 'Environmental enthusiast passionate about keeping our community clean and green.'
      },
      {
        name: 'Robert Wilson',
        email: 'robert.wilson@email.com',
        phone: '+1234567805',
        skills: 'General maintenance, Public transport',
        availability: 'Evenings, Weekends',
        location_preference: 'Bus stops and transport hubs',
        experience_level: 'intermediate',
        bio: 'Former public transport worker with knowledge of bus stops and transport infrastructure.'
      }
    ];
    
    for (const volunteer of sampleVolunteers) {
      await database.run(`
        INSERT INTO volunteers (name, email, phone, skills, availability, location_preference, experience_level, bio) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        volunteer.name, volunteer.email, volunteer.phone, volunteer.skills,
        volunteer.availability, volunteer.location_preference, volunteer.experience_level, volunteer.bio
      ]);
    }
    
    // Create sample issues
    const sampleIssues = [
      {
        title: 'Large pothole on Main Street',
        description: 'There is a significant pothole near the intersection of Main Street and 1st Avenue that is causing damage to vehicles. It has been growing larger over the past few weeks.',
        category: 'pothole',
        location: 'Main Street & 1st Avenue intersection',
        latitude: 40.7589,
        longitude: -73.9851,
        reporter_name: 'Alex Thompson',
        reporter_email: 'alex.thompson@email.com',
        reporter_phone: '+1234567901',
        status: 'open',
        priority: 'high'
      },
      {
        title: 'Broken street light on Oak Avenue',
        description: 'The street light in front of 245 Oak Avenue has been out for over a week. This creates a safety hazard for pedestrians walking at night.',
        category: 'streetlight',
        location: '245 Oak Avenue',
        latitude: 40.7614,
        longitude: -73.9776,
        reporter_name: 'Maria Garcia',
        reporter_email: 'maria.garcia@email.com',
        reporter_phone: '+1234567902',
        status: 'in_progress',
        priority: 'medium',
        assigned_volunteer_id: 2
      },
      {
        title: 'Water leak in Central Park area',
        description: 'There appears to be a water main leak causing water to pool on the sidewalk near the Central Park entrance. The water has been running for several days.',
        category: 'water_supply',
        location: 'Central Park entrance, 5th Avenue',
        latitude: 40.7829,
        longitude: -73.9654,
        reporter_name: 'David Kim',
        reporter_email: 'david.kim@email.com',
        reporter_phone: '+1234567903',
        status: 'open',
        priority: 'high'
      },
      {
        title: 'Overflowing garbage bins on Elm Street',
        description: 'The garbage bins on Elm Street between 2nd and 3rd Street have been overflowing for days. This is attracting pests and creating unsanitary conditions.',
        category: 'garbage',
        location: 'Elm Street between 2nd and 3rd Street',
        latitude: 40.7505,
        longitude: -73.9934,
        reporter_name: 'Jennifer Brown',
        reporter_email: 'jennifer.brown@email.com',
        reporter_phone: '+1234567904',
        status: 'resolved',
        priority: 'medium',
        assigned_volunteer_id: 4,
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        title: 'Damaged bus stop shelter',
        description: 'The bus stop shelter at the corner of Pine Street and Broadway has broken glass panels and graffiti. Commuters are exposed to weather conditions.',
        category: 'public_transport',
        location: 'Pine Street & Broadway bus stop',
        latitude: 40.7505,
        longitude: -73.9876,
        reporter_name: 'Thomas Anderson',
        reporter_email: 'thomas.anderson@email.com',
        reporter_phone: '+1234567905',
        status: 'in_progress',
        priority: 'medium',
        assigned_volunteer_id: 5
      },
      {
        title: 'Illegal dumping in vacant lot',
        description: 'Someone has been illegally dumping construction debris and household waste in the vacant lot on Maple Street. This needs immediate cleanup.',
        category: 'other',
        location: 'Vacant lot, 123 Maple Street',
        latitude: 40.7397,
        longitude: -73.9897,
        reporter_name: 'Lisa Martinez',
        reporter_email: 'lisa.martinez@email.com',
        reporter_phone: '+1234567906',
        status: 'open',
        priority: 'high'
      }
    ];
    
    for (const issue of sampleIssues) {
      const result = await database.run(`
        INSERT INTO issues (
          title, description, category, location, latitude, longitude,
          reporter_name, reporter_email, reporter_phone, status, priority,
          assigned_volunteer_id, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        issue.title, issue.description, issue.category, issue.location,
        issue.latitude, issue.longitude, issue.reporter_name, issue.reporter_email,
        issue.reporter_phone, issue.status, issue.priority,
        issue.assigned_volunteer_id || null, issue.resolved_at || null
      ]);
      
      // Add initial update for each issue
      await database.run(
        'INSERT INTO issue_updates (issue_id, update_type, message) VALUES (?, ?, ?)',
        [result.id, 'status_change', 'Issue reported and submitted for review']
      );
      
      // Add additional updates for in-progress and resolved issues
      if (issue.status === 'in_progress' || issue.status === 'resolved') {
        await database.run(
          'INSERT INTO issue_updates (issue_id, update_type, message) VALUES (?, ?, ?)',
          [result.id, 'assignment', `Assigned to volunteer for investigation and resolution`]
        );
      }
      
      if (issue.status === 'resolved') {
        await database.run(
          'INSERT INTO issue_updates (issue_id, update_type, message) VALUES (?, ?, ?)',
          [result.id, 'status_change', 'Issue has been resolved successfully']
        );
      }
    }
    
    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('🏛️  Council Credentials:');
    console.log('   Username: council');
    console.log('   Password: council123');
    console.log('');
    console.log('📊 Sample Data Created:');
    console.log(`   - ${sampleVolunteers.length} volunteers`);
    console.log(`   - ${sampleIssues.length} issues`);
    console.log('   - Multiple issue updates and status changes');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;