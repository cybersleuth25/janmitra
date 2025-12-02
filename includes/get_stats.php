<?php
// Get statistics API endpoint
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

try {
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
    
    // Get volunteers count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM volunteers");
    $stmt->execute();
    $volunteers_total = $stmt->fetch()['total'];
    
    // Get recent issues (last 7 days)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as recent_count 
        FROM issues 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $stmt->execute();
    $recent_issues = $stmt->fetch()['recent_count'];
    
    // Get category breakdown
    $stmt = $pdo->prepare("
        SELECT category, COUNT(*) as count 
        FROM issues 
        GROUP BY category 
        ORDER BY count DESC
    ");
    $stmt->execute();
    $category_breakdown = $stmt->fetchAll();
    
    // Get recent issues for homepage
    $stmt = $pdo->prepare("
        SELECT id, title, category, status, created_at, address
        FROM issues 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $recent_issues_list = $stmt->fetchAll();
    
    $stats = [
        'issues' => $issues_stats,
        'volunteers' => [
            'total' => (int)$volunteers_total
        ],
        'recent_issues_count' => (int)$recent_issues,
        'category_breakdown' => $category_breakdown,
        'recent_issues' => $recent_issues_list
    ];
    
    http_response_code(200);
    echo json_response(true, 'Statistics retrieved successfully', $stats);
    
} catch (PDOException $e) {
    log_error('Database error in get_stats.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in get_stats.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>