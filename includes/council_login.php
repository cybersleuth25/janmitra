<?php
// Municipal Council login API endpoint
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
    
    // Attempt council login
    $stmt = $pdo->prepare("SELECT id, username, password, full_name, email, department, role FROM council_users WHERE username = ? AND is_active = TRUE");
    $stmt->execute([$username]);
    $council_user = $stmt->fetch();
    
    if ($council_user && password_verify($password, $council_user['password'])) {
        // Set session variables
        $_SESSION['council_logged_in'] = true;
        $_SESSION['council_user_id'] = $council_user['id'];
        $_SESSION['council_username'] = $council_user['username'];
        $_SESSION['council_full_name'] = $council_user['full_name'];
        $_SESSION['council_email'] = $council_user['email'];
        $_SESSION['council_department'] = $council_user['department'];
        $_SESSION['council_role'] = $council_user['role'];
        
        // Create session record in database
        $session_id = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', time() + (24 * 60 * 60)); // 24 hours
        
        $stmt = $pdo->prepare("INSERT INTO council_sessions (session_id, council_user_id, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$session_id, $council_user['id'], $expires_at]);
        
        $_SESSION['council_session_id'] = $session_id;
        
        http_response_code(200);
        echo json_response(true, 'Council login successful', [
            'council_user' => [
                'id' => $council_user['id'],
                'username' => $council_user['username'],
                'full_name' => $council_user['full_name'],
                'email' => $council_user['email'],
                'department' => $council_user['department'],
                'role' => $council_user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_response(false, 'Invalid credentials for municipal council access');
    }
    
} catch (PDOException $e) {
    log_error('Database error in council_login.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred');
} catch (Exception $e) {
    log_error('General error in council_login.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}
?>