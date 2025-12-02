<?php
// Admin login API endpoint
require_once 'config.php';

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
    
    $username = sanitize_input($input['username'] ?? '');
    $password = $input['password'] ?? ''; // Don't sanitize password
    
    // Validation
    $errors = [];
    
    if (empty($username)) $errors[] = 'Username is required';
    if (empty($password)) $errors[] = 'Password is required';
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        exit;
    }
    
    // Attempt login
    if (login_admin($username, $password)) {
        http_response_code(200);
        echo json_response(true, 'Login successful', [
            'admin' => [
                'id' => $_SESSION['admin_id'],
                'username' => $_SESSION['admin_username']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_response(false, 'Invalid username or password');
    }
    
} catch (PDOException $e) {
    log_error('Database error in admin_login.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in admin_login.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>