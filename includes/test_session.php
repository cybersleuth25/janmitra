<?php
// Test session status
require_once 'config.php';

$session_info = [
    'session_id' => session_id(),
    'session_status' => session_status(),
    'admin_logged_in' => isset($_SESSION['admin_logged_in']) ? $_SESSION['admin_logged_in'] : false,
    'admin_id' => isset($_SESSION['admin_id']) ? $_SESSION['admin_id'] : null,
    'admin_username' => isset($_SESSION['admin_username']) ? $_SESSION['admin_username'] : null,
    'council_logged_in' => isset($_SESSION['council_logged_in']) ? $_SESSION['council_logged_in'] : false,
    'council_user_id' => isset($_SESSION['council_user_id']) ? $_SESSION['council_user_id'] : null,
    'council_username' => isset($_SESSION['council_username']) ? $_SESSION['council_username'] : null,
    'all_session_vars' => $_SESSION
];

echo json_response(true, 'Session information', $session_info);
?>