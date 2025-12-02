<?php
// Municipal Council logout API endpoint
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

try {
    // Remove session record from database if exists
    if (isset($_SESSION['council_session_id'])) {
        $stmt = $pdo->prepare("DELETE FROM council_sessions WHERE session_id = ?");
        $stmt->execute([$_SESSION['council_session_id']]);
    }
    
    // Destroy the session
    $_SESSION = array();
    session_destroy();
    
    http_response_code(200);
    echo json_response(true, 'Council logout successful');
    
} catch (PDOException $e) {
    log_error('Database error in council_logout.php: ' . $e->getMessage());
    
    // Still destroy session even if database error occurs
    $_SESSION = array();
    session_destroy();
    
    http_response_code(200);
    echo json_response(true, 'Council logout completed');
} catch (Exception $e) {
    log_error('General error in council_logout.php: ' . $e->getMessage());
    
    // Still destroy session even if error occurs
    $_SESSION = array();
    session_destroy();
    
    http_response_code(200);
    echo json_response(true, 'Council logout completed');
}
?>