const database = require('../database/db');

async function verifyDatabase() {
  try {
    console.log('📊 Verifying database setup...\n');
    
    // Connect to database
    await database.connect();
    
    // Check users table
    const users = await database.all('SELECT id, username, email, role, full_name FROM users');
    console.log('👥 Users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}): ${user.full_name} <${user.email}>`);
    });
    console.log(`   Total: ${users.length} users\n`);
    
    // Check volunteers table
    const volunteers = await database.all('SELECT id, name, email, skills, experience_level, status FROM volunteers');
    console.log('🙋 Volunteers:');
    volunteers.forEach(volunteer => {
      console.log(`   - ${volunteer.name} (${volunteer.experience_level}): ${volunteer.skills}`);
    });
    console.log(`   Total: ${volunteers.length} volunteers\n`);
    
    // Check issues table
    const issues = await database.all('SELECT id, title, category, status, priority, reporter_name FROM issues');
    console.log('🎯 Issues:');
    issues.forEach(issue => {
      console.log(`   - [${issue.status.toUpperCase()}] ${issue.title} (${issue.category}, ${issue.priority} priority)`);
    });
    console.log(`   Total: ${issues.length} issues\n`);
    
    // Check issue updates
    const updates = await database.all('SELECT COUNT(*) as count FROM issue_updates');
    console.log(`📝 Issue Updates: ${updates[0].count} total updates\n`);
    
    // Get statistics by category
    const categoryStats = await database.all(`
      SELECT category, COUNT(*) as count, 
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM issues 
      GROUP BY category
    `);
    console.log('📈 Issues by Category:');
    categoryStats.forEach(stat => {
      console.log(`   - ${stat.category}: ${stat.count} total (${stat.resolved} resolved)`);
    });
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await database.close();
  }
}

verifyDatabase();