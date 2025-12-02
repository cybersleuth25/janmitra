<?php
// Admin logout endpoint
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_response(false, 'Method not allowed');
    exit;
}

// Clear admin session
logout_admin();

http_response_code(200);
echo json_response(true, 'Admin logout successful');
?>