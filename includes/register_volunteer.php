<?php
// Volunteer registration handler
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
    
    // Sanitize and validate input
    $name = sanitize_input($input['name'] ?? '');
    $email = sanitize_input($input['email'] ?? '');
    $phone = sanitize_input($input['phone'] ?? '');
    $skills = sanitize_input($input['skills'] ?? '');
    $availability = sanitize_input($input['availability'] ?? '');
    $area = sanitize_input($input['area'] ?? '');
    
    // Validation
    $errors = [];
    
    if (empty($name)) $errors[] = 'Name is required';
    if (empty($email)) $errors[] = 'Email is required';
    if (empty($phone)) $errors[] = 'Phone number is required';
    if (empty($skills)) $errors[] = 'Skills are required';
    if (empty($availability)) $errors[] = 'Availability is required';
    if (empty($area)) $errors[] = 'Service area is required';
    
    if (!validate_email($email)) {
        $errors[] = 'Valid email address is required';
    }
    
    if (!validate_phone($phone)) {
        $errors[] = 'Valid phone number is required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        exit;
    }
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM volunteers WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_response(false, 'Email address is already registered as a volunteer');
        exit;
    }
    
    // Insert into database
    $sql = "INSERT INTO volunteers (name, email, phone, skills, availability, area, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$name, $email, $phone, $skills, $availability, $area]);
    
    if ($result) {
        $volunteer_id = $pdo->lastInsertId();
        
        // Get the created volunteer for response
        $stmt = $pdo->prepare("SELECT * FROM volunteers WHERE id = ?");
        $stmt->execute([$volunteer_id]);
        $volunteer = $stmt->fetch();
        
        // Send welcome email (optional)
        // send_welcome_email($email, $name, $volunteer_id);
        
        http_response_code(201);
        echo json_response(true, 'Volunteer registration successful!', [
            'volunteer_id' => $volunteer_id,
            'volunteer' => $volunteer
        ]);
    } else {
        throw new Exception('Failed to register volunteer in database');
    }
    
} catch (PDOException $e) {
    log_error('Database error in register_volunteer.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred. Please try again later.');
} catch (Exception $e) {
    log_error('General error in register_volunteer.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}

// Send welcome email (placeholder)
function send_welcome_email($email, $name, $volunteer_id) {
    $subject = "Welcome to Local Issues Reporter - Volunteer Registration Confirmed";
    $message = "
    Dear $name,
    
    Thank you for registering as a volunteer with our Local Issues Reporter community platform.
    
    Your volunteer registration has been confirmed with ID: $volunteer_id
    
    You may be contacted by community members or local authorities when your assistance is needed for community issues that match your skills and availability.
    
    Thank you for your commitment to making our community better!
    
    Best regards,
    Local Issues Reporter Team
    ";
    
    $headers = "From: volunteers@localissues.com\r\n";
    $headers .= "Reply-To: support@localissues.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // In a production environment, use a proper email service
    // mail($email, $subject, $message, $headers);
}
?>
