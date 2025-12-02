<?php
// Admin update issue status API endpoint
require_once 'config.php';

// Require admin authentication
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

try {
    // Get POST data - handle both form data and JSON
    $input = [];
    
    // Try to get JSON input first
    $json_input = json_decode(file_get_contents('php://input'), true);
    if (!empty($json_input)) {
        $input = $json_input;
    } else {
        $input = $_POST;
    }
    
    $issue_id = (int)($input['issue_id'] ?? 0);
    $new_status = sanitize_input($input['status'] ?? '');
    
    // Validation
    $errors = [];
    
    if (!$issue_id) $errors[] = 'Issue ID is required';
    if (!$new_status) $errors[] = 'Status is required';
    
    $allowed_statuses = ['open', 'in_progress', 'resolved'];
    if (!in_array($new_status, $allowed_statuses)) {
        $errors[] = 'Invalid status provided';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        exit;
    }
    
    // Update issue status
    $stmt = $pdo->prepare("UPDATE issues SET status = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$new_status, $issue_id]);
    
    if ($result && $stmt->rowCount() > 0) {
        // Get updated issue
        $stmt = $pdo->prepare("SELECT * FROM issues WHERE id = ?");
        $stmt->execute([$issue_id]);
        $updated_issue = $stmt->fetch();
        
        http_response_code(200);
        echo json_response(true, 'Issue status updated successfully', [
            'issue' => $updated_issue
        ]);
    } else {
        http_response_code(404);
        echo json_response(false, 'Issue not found or no changes made');
    }
    
} catch (PDOException $e) {
    log_error('Database error in admin_update_issue.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in admin_update_issue.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>