<?php
// SQLite Database Admin Interface
$dbPath = '../database/local_issues.db';

// Check if database exists
if (!file_exists($dbPath)) {
    die("Database not found at: " . $dbPath);
}

// Connect to SQLite database
try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Handle actions
$action = $_GET['action'] ?? 'dashboard';
$table = $_GET['table'] ?? '';
$message = '';

if ($_POST) {
    switch ($action) {
        case 'add_volunteer':
            $stmt = $pdo->prepare("INSERT INTO volunteers (name, email, phone, skills, availability, location_preference, experience_level, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $_POST['name'], $_POST['email'], $_POST['phone'], $_POST['skills'],
                $_POST['availability'], $_POST['location_preference'], $_POST['experience_level'], $_POST['bio']
            ]);
            $message = "Volunteer added successfully!";
            break;
            
        case 'add_issue':
            $stmt = $pdo->prepare("INSERT INTO issues (title, description, category, location, latitude, longitude, reporter_name, reporter_email, reporter_phone, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $_POST['title'], $_POST['description'], $_POST['category'], $_POST['location'],
                $_POST['latitude'] ?: null, $_POST['longitude'] ?: null,
                $_POST['reporter_name'], $_POST['reporter_email'], $_POST['reporter_phone'],
                $_POST['status'] ?? 'open', $_POST['priority'] ?? 'medium'
            ]);
            $message = "Issue added successfully!";
            break;
    }
}

// Get table counts for dashboard
$tables = ['users', 'volunteers', 'issues', 'issue_updates'];
$counts = [];
foreach ($tables as $tableName) {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM $tableName");
    $counts[$tableName] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local Issues Database Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .nav { display: flex; gap: 10px; margin-bottom: 20px; }
        .nav a { 
            padding: 10px 15px; 
            background: #3498db; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            transition: background 0.3s;
        }
        .nav a:hover { background: #2980b9; }
        .nav a.active { background: #27ae60; }
        
        .card { 
            background: white; 
            border-radius: 10px; 
            padding: 20px; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        tr:hover { background: #f5f5f5; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-size: 14px;
        }
        .form-group textarea { resize: vertical; min-height: 100px; }
        
        .btn { 
            padding: 10px 20px; 
            background: #27ae60; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            transition: background 0.3s;
        }
        .btn:hover { background: #229954; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        
        .message { 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb;
        }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ Local Issues Database Admin</h1>
            <p>Manage volunteers, issues, and database records</p>
        </div>

        <div class="nav">
            <a href="?action=dashboard" class="<?= $action === 'dashboard' ? 'active' : '' ?>">📊 Dashboard</a>
            <a href="?action=volunteers" class="<?= $action === 'volunteers' ? 'active' : '' ?>">🙋 Volunteers</a>
            <a href="?action=issues" class="<?= $action === 'issues' ? 'active' : '' ?>">🎯 Issues</a>
            <a href="?action=users" class="<?= $action === 'users' ? 'active' : '' ?>">👥 Users</a>
            <a href="?action=add_volunteer" class="<?= $action === 'add_volunteer' ? 'active' : '' ?>">➕ Add Volunteer</a>
            <a href="?action=add_issue" class="<?= $action === 'add_issue' ? 'active' : '' ?>">➕ Add Issue</a>
            <a href="backup.php" style="background: #f39c12;">🛠️ Database Management</a>
        </div>

        <?php if ($message): ?>
        <div class="message"><?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php switch ($action): case 'dashboard': ?>
        <div class="card">
            <h2>📊 Database Overview</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number"><?= $counts['users'] ?></div>
                    <div>Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?= $counts['volunteers'] ?></div>
                    <div>Volunteers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?= $counts['issues'] ?></div>
                    <div>Issues Reported</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?= $counts['issue_updates'] ?></div>
                    <div>Issue Updates</div>
                </div>
            </div>
        </div>

        <?php
        // Recent issues
        $recentIssues = $pdo->query("SELECT * FROM issues ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        ?>
        <div class="card">
            <h3>🆕 Recent Issues</h3>
            <table>
                <tr><th>Title</th><th>Category</th><th>Status</th><th>Reporter</th><th>Created</th></tr>
                <?php foreach ($recentIssues as $issue): ?>
                <tr>
                    <td><?= htmlspecialchars($issue['title']) ?></td>
                    <td><?= htmlspecialchars($issue['category']) ?></td>
                    <td><span style="padding: 3px 8px; border-radius: 12px; background: <?= $issue['status'] === 'resolved' ? '#d4edda' : ($issue['status'] === 'in_progress' ? '#fff3cd' : '#f8d7da') ?>; color: <?= $issue['status'] === 'resolved' ? '#155724' : ($issue['status'] === 'in_progress' ? '#856404' : '#721c24') ?>;"><?= htmlspecialchars($issue['status']) ?></span></td>
                    <td><?= htmlspecialchars($issue['reporter_name']) ?></td>
                    <td><?= date('M j, Y', strtotime($issue['created_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>
        
        <?php break; case 'volunteers': ?>
        <?php $volunteers = $pdo->query("SELECT * FROM volunteers ORDER BY joined_at DESC")->fetchAll(PDO::FETCH_ASSOC); ?>
        <div class="card">
            <h2>🙋 Volunteers (<?= count($volunteers) ?>)</h2>
            <table>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Skills</th><th>Experience</th><th>Status</th><th>Joined</th></tr>
                <?php foreach ($volunteers as $volunteer): ?>
                <tr>
                    <td><?= htmlspecialchars($volunteer['name']) ?></td>
                    <td><?= htmlspecialchars($volunteer['email']) ?></td>
                    <td><?= htmlspecialchars($volunteer['phone']) ?></td>
                    <td><?= htmlspecialchars($volunteer['skills']) ?></td>
                    <td><?= htmlspecialchars($volunteer['experience_level']) ?></td>
                    <td><?= htmlspecialchars($volunteer['status']) ?></td>
                    <td><?= date('M j, Y', strtotime($volunteer['joined_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>
        
        <?php break; case 'issues': ?>
        <?php $issues = $pdo->query("SELECT * FROM issues ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC); ?>
        <div class="card">
            <h2>🎯 Issues (<?= count($issues) ?>)</h2>
            <table>
                <tr><th>Title</th><th>Category</th><th>Status</th><th>Priority</th><th>Reporter</th><th>Location</th><th>Created</th></tr>
                <?php foreach ($issues as $issue): ?>
                <tr>
                    <td><?= htmlspecialchars($issue['title']) ?></td>
                    <td><?= htmlspecialchars($issue['category']) ?></td>
                    <td><span style="padding: 3px 8px; border-radius: 12px; background: <?= $issue['status'] === 'resolved' ? '#d4edda' : ($issue['status'] === 'in_progress' ? '#fff3cd' : '#f8d7da') ?>; color: <?= $issue['status'] === 'resolved' ? '#155724' : ($issue['status'] === 'in_progress' ? '#856404' : '#721c24') ?>;"><?= htmlspecialchars($issue['status']) ?></span></td>
                    <td><span style="color: <?= $issue['priority'] === 'high' ? '#dc3545' : ($issue['priority'] === 'medium' ? '#fd7e14' : '#28a745') ?>;">⬤ <?= htmlspecialchars($issue['priority']) ?></span></td>
                    <td><?= htmlspecialchars($issue['reporter_name']) ?></td>
                    <td><?= htmlspecialchars($issue['location']) ?></td>
                    <td><?= date('M j, Y', strtotime($issue['created_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>
        
        <?php break; case 'users': ?>
        <?php $users = $pdo->query("SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC); ?>
        <div class="card">
            <h2>👥 Users (<?= count($users) ?>)</h2>
            <table>
                <tr><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Created</th></tr>
                <?php foreach ($users as $user): ?>
                <tr>
                    <td><?= htmlspecialchars($user['username']) ?></td>
                    <td><?= htmlspecialchars($user['full_name']) ?></td>
                    <td><?= htmlspecialchars($user['email']) ?></td>
                    <td><span style="padding: 3px 8px; border-radius: 12px; background: <?= $user['role'] === 'admin' ? '#dc3545' : '#007bff' ?>; color: white;"><?= htmlspecialchars($user['role']) ?></span></td>
                    <td><?= date('M j, Y', strtotime($user['created_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>
        
        <?php break; case 'add_volunteer': ?>
        <div class="card">
            <h2>➕ Add New Volunteer</h2>
            <form method="POST">
                <div class="grid-2">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label>Experience Level</label>
                        <select name="experience_level">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Skills</label>
                    <input type="text" name="skills" placeholder="e.g., Road maintenance, Electrical work, Plumbing">
                </div>
                <div class="form-group">
                    <label>Availability</label>
                    <input type="text" name="availability" placeholder="e.g., Weekends, Evenings, Flexible">
                </div>
                <div class="form-group">
                    <label>Location Preference</label>
                    <input type="text" name="location_preference" placeholder="e.g., Downtown area, City-wide">
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" placeholder="Brief description about the volunteer's background and motivation"></textarea>
                </div>
                <button type="submit" class="btn">Add Volunteer</button>
            </form>
        </div>
        
        <?php break; case 'add_issue': ?>
        <div class="card">
            <h2>➕ Add New Issue</h2>
            <form method="POST">
                <div class="grid-2">
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" required>
                            <option value="">Select Category</option>
                            <option value="pothole">Pothole</option>
                            <option value="streetlight">Street Light</option>
                            <option value="water_supply">Water Supply</option>
                            <option value="garbage">Garbage</option>
                            <option value="public_transport">Public Transport</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea name="description" required placeholder="Detailed description of the issue"></textarea>
                </div>
                <div class="form-group">
                    <label>Location *</label>
                    <input type="text" name="location" required placeholder="e.g., Main Street & 1st Avenue intersection">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Latitude (optional)</label>
                        <input type="number" name="latitude" step="any" placeholder="40.7589">
                    </div>
                    <div class="form-group">
                        <label>Longitude (optional)</label>
                        <input type="number" name="longitude" step="any" placeholder="-73.9851">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Reporter Name *</label>
                        <input type="text" name="reporter_name" required>
                    </div>
                    <div class="form-group">
                        <label>Reporter Email *</label>
                        <input type="email" name="reporter_email" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Reporter Phone</label>
                    <input type="tel" name="reporter_phone" placeholder="+1234567890">
                </div>
                <button type="submit" class="btn">Add Issue</button>
            </form>
        </div>
        
        <?php endswitch; ?>
    </div>
</body>
</html>