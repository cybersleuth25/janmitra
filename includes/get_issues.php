<?php
// Get issues API endpoint
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

try {
    // Get query parameters
    $category = $_GET['category'] ?? 'all';
    $status = $_GET['status'] ?? 'all';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query
    $where_conditions = [];
    $params = [];
    
    if ($category !== 'all') {
        $where_conditions[] = 'category = ?';
        $params[] = $category;
    }
    
    if ($status !== 'all') {
        $where_conditions[] = 'status = ?';
        $params[] = $status;
    }
    
    $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
    $limit_clause = $limit ? "LIMIT $limit OFFSET $offset" : '';
    
    $sql = "SELECT * FROM issues $where_clause ORDER BY created_at DESC $limit_clause";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $issues = $stmt->fetchAll();
    
    // Get total count for pagination
    $count_sql = "SELECT COUNT(*) as total FROM issues $where_clause";
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($params);
    $total = $count_stmt->fetch()['total'];
    
    http_response_code(200);
    echo json_response(true, 'Issues retrieved successfully', [
        'issues' => $issues,
        'total' => $total,
        'offset' => $offset,
        'limit' => $limit
    ]);
    
} catch (PDOException $e) {
    log_error('Database error in get_issues.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in get_issues.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>