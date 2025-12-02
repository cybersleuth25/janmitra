<?php
// Issue submission handler
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
    $title = sanitize_input($input['title'] ?? '');
    $name = sanitize_input($input['name'] ?? '');
    $email = sanitize_input($input['email'] ?? '');
    $phone = sanitize_input($input['phone'] ?? '');
    $address = sanitize_input($input['address'] ?? '');
    $category = sanitize_input($input['category'] ?? '');
    $description = sanitize_input($input['description'] ?? '');
    
    // Validation
    $errors = [];
    
    if (empty($title)) $errors[] = 'Title is required';
    if (empty($name)) $errors[] = 'Name is required';
    if (empty($email)) $errors[] = 'Email is required';
    if (empty($address)) $errors[] = 'Address/Location is required';
    if (empty($category)) $errors[] = 'Category is required';
    if (empty($description)) $errors[] = 'Description is required';
    
    if (!validate_email($email)) {
        $errors[] = 'Valid email address is required';
    }
    
    if (!empty($phone) && !validate_phone($phone)) {
        $errors[] = 'Invalid phone number format';
    }
    
    $allowed_categories = ['pothole', 'streetlight', 'water_supply', 'garbage', 'public_transport', 'sidewalk', 'other'];
    if (!in_array($category, $allowed_categories)) {
        $errors[] = 'Invalid category selected';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        exit;
    }
    
    // Handle file upload if present
    $photo_path = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $photo_filename = handle_file_upload($_FILES['photo']);
            if ($photo_filename) {
                $photo_path = 'uploads/' . $photo_filename;
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_response(false, 'File upload error: ' . $e->getMessage());
            exit;
        }
    }
    
    // Insert into database
    $sql = "INSERT INTO issues (title, name, email, phone, address, category, description, photo_path, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $title,
        $name,
        $email,
        $phone ?: null,
        $address,
        $category,
        $description,
        $photo_path
    ]);
    
    if ($result) {
        $issue_id = $pdo->lastInsertId();
        
        // Get the created issue for response
        $stmt = $pdo->prepare("SELECT * FROM issues WHERE id = ?");
        $stmt->execute([$issue_id]);
        $issue = $stmt->fetch();
        
        // Send confirmation email (optional)
        // send_confirmation_email($email, $name, $issue_id);
        
        http_response_code(201);
        echo json_response(true, 'Issue submitted successfully!', [
            'issue_id' => $issue_id,
            'reference_id' => 'REP-' . str_pad($issue_id, 6, '0', STR_PAD_LEFT),
            'issue' => $issue
        ]);
    } else {
        throw new Exception('Failed to insert issue into database');
    }
    
} catch (PDOException $e) {
    log_error('Database error in submit_issue.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'Database error occurred. Please try again later.');
} catch (Exception $e) {
    log_error('General error in submit_issue.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}

// Send confirmation email (placeholder - implement with your preferred email service)
function send_confirmation_email($email, $name, $issue_id) {
    $subject = "Issue Report Confirmation - Reference #REP-" . str_pad($issue_id, 6, '0', STR_PAD_LEFT);
    $message = "
    Dear $name,
    
    Thank you for reporting an issue to our community reporting system.
    
    Your report has been received and assigned reference ID: REP-" . str_pad($issue_id, 6, '0', STR_PAD_LEFT) . "
    
    We will review your report and take appropriate action. You will receive updates via email as the status of your report changes.
    
    Best regards,
    Local Issues Reporter Team
    ";
    
    $headers = "From: noreply@localissues.com\r\n";
    $headers .= "Reply-To: support@localissues.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // In a production environment, use a proper email service
    // mail($email, $subject, $message, $headers);
}
?>
