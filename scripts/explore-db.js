const database = require('../database/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function executeQuery(query) {
  try {
    const result = await database.all(query);
    if (result && result.length > 0) {
      console.table(result);
    } else {
      console.log('No results found.');
    }
  } catch (error) {
    console.error('❌ Query error:', error.message);
  }
}

async function showHelp() {
  console.log('\n📚 Available Commands:');
  console.log('  tables          - Show all tables');
  console.log('  users           - Show all users');
  console.log('  volunteers      - Show all volunteers');
  console.log('  issues          - Show all issues');
  console.log('  updates         - Show issue updates');
  console.log('  schema [table]  - Show table structure');
  console.log('  sql [query]     - Execute custom SQL query');
  console.log('  help            - Show this help');
  console.log('  exit            - Exit the explorer');
  console.log('');
}

async function showTables() {
  console.log('\n📋 Database Tables:');
  const query = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
  await executeQuery(query);
}

async function showSchema(tableName) {
  if (!tableName) {
    console.log('Usage: schema [table_name]');
    return;
  }
  console.log(`\n🏗️  Schema for table '${tableName}':`);
  const query = `PRAGMA table_info(${tableName})`;
  await executeQuery(query);
}

async function main() {
  console.log('🗄️  SQLite Database Explorer');
  console.log('================================\n');
  
  try {
    await database.connect();
    console.log('✅ Connected to database');
    
    await showHelp();
    
    function promptUser() {
      rl.question('db> ', async (input) => {
        const [command, ...args] = input.trim().split(' ');
        
        switch (command.toLowerCase()) {
          case 'exit':
          case 'quit':
            console.log('👋 Goodbye!');
            await database.close();
            rl.close();
            return;
            
          case 'help':
            await showHelp();
            break;
            
          case 'tables':
            await showTables();
            break;
            
          case 'users':
            console.log('\n👥 Users:');
            await executeQuery('SELECT * FROM users');
            break;
            
          case 'volunteers':
            console.log('\n🙋 Volunteers:');
            await executeQuery('SELECT * FROM volunteers');
            break;
            
          case 'issues':
            console.log('\n🎯 Issues:');
            await executeQuery('SELECT id, title, category, status, priority, reporter_name, created_at FROM issues ORDER BY created_at DESC');
            break;
            
          case 'updates':
            console.log('\n📝 Issue Updates:');
            await executeQuery('SELECT iu.*, i.title as issue_title FROM issue_updates iu JOIN issues i ON iu.issue_id = i.id ORDER BY iu.created_at DESC');
            break;
            
          case 'schema':
            await showSchema(args[0]);
            break;
            
          case 'sql':
            if (args.length === 0) {
              console.log('Usage: sql [query]');
            } else {
              const query = args.join(' ');
              console.log(`\n🔍 Executing: ${query}`);
              await executeQuery(query);
            }
            break;
            
          case '':
            break;
            
          default:
            console.log(`❓ Unknown command: ${command}. Type 'help' for available commands.`);
        }
        
        promptUser();
      });
    }
    
    promptUser();
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    rl.close();
  }
}

main();