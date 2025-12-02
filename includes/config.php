<?php
// Database configuration for XAMPP
define('DB_HOST', 'localhost');
define('DB_NAME', 'local_issues_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // Default XAMPP password is empty

// Site configuration
define('SITE_NAME', 'Local Issues Reporter');
define('UPLOAD_DIR', '../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Enable CORS for frontend requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create database connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Helper function to sanitize input
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Generate JSON response
function json_response($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    return json_encode($response);
}

// Validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Validate phone number
function validate_phone($phone) {
    if (empty($phone)) return true; // Phone is optional
    return preg_match('/^[\+]?[\d\s\-\(\)]{10,}$/', $phone);
}

// Log errors
function log_error($message) {
    $log_file = '../logs/error_' . date('Y-m-d') . '.log';
    $log_message = date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL;
    
    // Create logs directory if it doesn't exist
    $log_dir = dirname($log_file);
    if (!file_exists($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    file_put_contents($log_file, $log_message, FILE_APPEND | LOCK_EX);
}

// Admin authentication functions
function is_admin() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function require_admin() {
    if (!is_admin()) {
        http_response_code(401);
        echo json_response(false, 'Admin authentication required');
        exit();
    }
}

function login_admin($username, $password) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, password FROM admin_users WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        
        if ($admin && password_verify($password, $admin['password'])) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            return true;
        }
        return false;
    } catch (PDOException $e) {
        log_error('Admin login error: ' . $e->getMessage());
        return false;
    }
}

function logout_admin() {
    $_SESSION = array();
    session_destroy();
}

// File upload function
function handle_file_upload($file, $upload_dir = null) {
    if ($upload_dir === null) {
        $upload_dir = UPLOAD_DIR;
    }
    
    if (!isset($file['error']) || is_array($file['error'])) {
        throw new RuntimeException('Invalid parameters.');
    }
    
    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            return null; // No file uploaded, this is okay
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Exceeded filesize limit.');
        default:
            throw new RuntimeException('Unknown file upload error.');
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        throw new RuntimeException('Exceeded filesize limit.');
    }
    
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    
    if (!array_key_exists($mimeType, $allowedMimes)) {
        throw new RuntimeException('Invalid file format.');
    }
    
    $extension = $allowedMimes[$mimeType];
    $filename = sprintf('%s_%s.%s', date('Y-m-d_H-i-s'), uniqid(), $extension);
    $filepath = $upload_dir . $filename;
    
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new RuntimeException('Failed to move uploaded file.');
    }
    
    return $filename;
}

// Redirect function
function redirect($url) {
    header("Location: $url");
    exit();
}

?>
