<?php
// Database Backup and Management Utilities
$dbPath = '../database/local_issues.db';
$backupDir = '../backups';

// Create backups directory if it doesn't exist
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Handle actions
$action = $_GET['action'] ?? '';
$message = '';

switch ($action) {
    case 'backup':
        $timestamp = date('Y-m-d_H-i-s');
        $backupFile = $backupDir . "/local_issues_backup_$timestamp.db";
        
        if (copy($dbPath, $backupFile)) {
            $message = "✅ Database backed up successfully to: " . basename($backupFile);
        } else {
            $message = "❌ Backup failed!";
        }
        break;
        
    case 'export_csv':
        $table = $_GET['table'] ?? '';
        if ($table) {
            try {
                $pdo = new PDO('sqlite:' . $dbPath);
                $stmt = $pdo->query("SELECT * FROM $table");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if ($data) {
                    $filename = $table . '_export_' . date('Y-m-d_H-i-s') . '.csv';
                    header('Content-Type: text/csv');
                    header('Content-Disposition: attachment; filename="' . $filename . '"');
                    
                    $output = fopen('php://output', 'w');
                    fputcsv($output, array_keys($data[0])); // Header row
                    
                    foreach ($data as $row) {
                        fputcsv($output, $row);
                    }
                    
                    fclose($output);
                    exit;
                }
            } catch (Exception $e) {
                $message = "❌ Export failed: " . $e->getMessage();
            }
        }
        break;
}

// Get backup files
$backupFiles = [];
if (file_exists($backupDir)) {
    $files = scandir($backupDir);
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'db') {
            $backupFiles[] = [
                'name' => $file,
                'size' => filesize($backupDir . '/' . $file),
                'date' => filemtime($backupDir . '/' . $file)
            ];
        }
    }
    // Sort by date (newest first)
    usort($backupFiles, function($a, $b) {
        return $b['date'] - $a['date'];
    });
}

// Connect to database for stats
try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $tables = ['users', 'volunteers', 'issues', 'issue_updates'];
    $stats = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
        $stats[$table] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    // Get database file size
    $dbSize = filesize($dbPath);
} catch (Exception $e) {
    $message = "❌ Database connection failed: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Management - Local Issues Admin</title>
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
        }
        .nav a:hover { background: #2980b9; }
        
        .card { 
            background: white; 
            border-radius: 10px; 
            padding: 20px; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .btn { 
            padding: 10px 20px; 
            background: #27ae60; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover { background: #229954; }
        .btn-warning { background: #f39c12; }
        .btn-warning:hover { background: #d68910; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        
        .message { 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
            background: #d4edda; 
            color: #155724;
        }
        
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-item { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            border-left: 4px solid #3498db;
        }
        .stat-number { font-size: 1.5em; font-weight: bold; color: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛠️ Database Management</h1>
            <p>Backup, export, and manage your database</p>
        </div>

        <div class="nav">
            <a href="index.php">← Back to Admin</a>
            <a href="?action=backup" class="btn-warning">📦 Create Backup</a>
        </div>

        <?php if ($message): ?>
        <div class="message"><?= $message ?></div>
        <?php endif; ?>

        <div class="card">
            <h2>📊 Database Statistics</h2>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number"><?= number_format($dbSize / 1024, 1) ?> KB</div>
                    <div>Database Size</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number"><?= $stats['users'] ?></div>
                    <div>Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number"><?= $stats['volunteers'] ?></div>
                    <div>Volunteers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number"><?= $stats['issues'] ?></div>
                    <div>Issues</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📤 Export Data</h3>
            <p>Export table data as CSV files:</p>
            <div style="margin-top: 15px;">
                <a href="?action=export_csv&table=volunteers" class="btn">Export Volunteers</a>
                <a href="?action=export_csv&table=issues" class="btn">Export Issues</a>
                <a href="?action=export_csv&table=users" class="btn">Export Users</a>
                <a href="?action=export_csv&table=issue_updates" class="btn">Export Issue Updates</a>
            </div>
        </div>

        <div class="card">
            <h3>📦 Database Backups (<?= count($backupFiles) ?>)</h3>
            
            <?php if (empty($backupFiles)): ?>
                <p>No backups found. <a href="?action=backup" class="btn btn-warning">Create First Backup</a></p>
            <?php else: ?>
                <table>
                    <tr>
                        <th>Backup File</th>
                        <th>Size</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                    <?php foreach ($backupFiles as $backup): ?>
                    <tr>
                        <td><?= htmlspecialchars($backup['name']) ?></td>
                        <td><?= number_format($backup['size'] / 1024, 1) ?> KB</td>
                        <td><?= date('Y-m-d H:i:s', $backup['date']) ?></td>
                        <td>
                            <a href="../backups/<?= urlencode($backup['name']) ?>" class="btn" download>📥 Download</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </table>
            <?php endif; ?>
        </div>

        <div class="card">
            <h3>ℹ️ Database Information</h3>
            <table>
                <tr><td><strong>Database Type</strong></td><td>SQLite</td></tr>
                <tr><td><strong>Database File</strong></td><td><?= htmlspecialchars($dbPath) ?></td></tr>
                <tr><td><strong>File Size</strong></td><td><?= number_format($dbSize / 1024, 2) ?> KB</td></tr>
                <tr><td><strong>Last Modified</strong></td><td><?= date('Y-m-d H:i:s', filemtime($dbPath)) ?></td></tr>
                <tr><td><strong>Backup Directory</strong></td><td><?= htmlspecialchars($backupDir) ?></td></tr>
            </table>
        </div>
    </div>
</body>
</html>