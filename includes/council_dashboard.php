<?php
// Municipal Council dashboard API endpoint
require_once 'config.php';

// Check if council user is logged in
if (!isset($_SESSION['council_logged_in']) || !$_SESSION['council_logged_in']) {
    http_response_code(401);
    echo json_response(false, 'Council authentication required');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

try {
    // Get current council user info
    $council_user_id = $_SESSION['council_user_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM council_users WHERE id = ?");
    $stmt->execute([$council_user_id]);
    $council_user = $stmt->fetch();
    
    if (!$council_user) {
        session_destroy();
        http_response_code(401);
        echo json_response(false, 'Invalid council session');
        exit;
    }
    
    // Get issues statistics
    $issues_stats = [
        'total' => 0,
        'open' => 0,
        'in_progress' => 0,
        'resolved' => 0
    ];
    
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM issues GROUP BY status");
    $stmt->execute();
    $issue_counts = $stmt->fetchAll();
    
    foreach ($issue_counts as $count) {
        $issues_stats[$count['status']] = (int)$count['count'];
        $issues_stats['total'] += (int)$count['count'];
    }
    
    // Get all issues for council dashboard
    $stmt = $pdo->prepare("
        SELECT id, title, name as reporter_name, email as reporter_email, 
               address, category, status, created_at, updated_at
        FROM issues 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $all_issues = $stmt->fetchAll();
    
    // Get volunteers count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM volunteers");
    $stmt->execute();
    $volunteers_total = $stmt->fetch()['total'];
    
    $dashboard_data = [
        'user' => [
            'id' => $council_user['id'],
            'username' => $council_user['username'],
            'full_name' => $council_user['full_name'],
            'email' => $council_user['email'],
            'department' => $council_user['department'],
            'role' => $council_user['role']
        ],
        'statistics' => [
            'issues' => $issues_stats,
            'volunteers' => [
                'total' => (int)$volunteers_total
            ]
        ],
        'issues' => $all_issues
    ];
    
    http_response_code(200);
    echo json_response(true, 'Council dashboard data retrieved successfully', $dashboard_data);
    
} catch (PDOException $e) {
    log_error('Database error in council_dashboard.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in council_dashboard.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>