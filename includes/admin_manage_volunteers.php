<?php
// Admin volunteer management API endpoint
require_once 'config.php';

// Require admin authentication
require_admin();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetVolunteers();
            break;
        case 'POST':
            handleCreateVolunteer();
            break;
        case 'PUT':
            handleUpdateVolunteer();
            break;
        case 'DELETE':
            handleDeleteVolunteer();
            break;
        default:
            http_response_code(405);
            echo json_response(false, 'Method not allowed');
            break;
    }
} catch (Exception $e) {
    log_error('Error in admin_manage_volunteers.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_response(false, 'An error occurred: ' . $e->getMessage());
}

// Get all volunteers with pagination
function handleGetVolunteers() {
    global $pdo;
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $search = isset($_GET['search']) ? sanitize_input($_GET['search']) : '';
    $area = isset($_GET['area']) ? sanitize_input($_GET['area']) : '';
    
    $offset = ($page - 1) * $limit;
    
    // Build WHERE clause
    $where_conditions = [];
    $params = [];
    
    if ($search) {
        $where_conditions[] = "(name LIKE ? OR email LIKE ? OR skills LIKE ?)";
        $search_param = "%$search%";
        $params[] = $search_param;
        $params[] = $search_param;
        $params[] = $search_param;
    }
    
    if ($area) {
        $where_conditions[] = "area = ?";
        $params[] = $area;
    }
    
    $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
    
    // Get total count
    $count_sql = "SELECT COUNT(*) FROM volunteers $where_clause";
    $stmt = $pdo->prepare($count_sql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();
    
    // Get volunteers
    $sql = "SELECT id, name, email, phone, skills, availability, area, created_at 
            FROM volunteers 
            $where_clause 
            ORDER BY created_at DESC 
            LIMIT $limit OFFSET $offset";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $volunteers = $stmt->fetchAll();
    
    // Get unique areas for filtering
    $areas_sql = "SELECT DISTINCT area FROM volunteers WHERE area IS NOT NULL AND area != '' ORDER BY area";
    $stmt = $pdo->prepare($areas_sql);
    $stmt->execute();
    $areas = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    http_response_code(200);
    echo json_response(true, 'Volunteers retrieved successfully', [
        'volunteers' => $volunteers,
        'pagination' => [
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ],
        'areas' => $areas
    ]);
}

// Create new volunteer (admin can add volunteers manually)
function handleCreateVolunteer() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
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
    if (!validate_email($email)) $errors[] = 'Valid email is required';
    if (empty($skills)) $errors[] = 'Skills are required';
    if (empty($availability)) $errors[] = 'Availability is required';
    if (empty($area)) $errors[] = 'Area is required';
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        return;
    }
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM volunteers WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_response(false, 'Email address is already registered');
        return;
    }
    
    // Insert volunteer
    $sql = "INSERT INTO volunteers (name, email, phone, skills, availability, area, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$name, $email, $phone, $skills, $availability, $area]);
    
    if ($result) {
        $volunteer_id = $pdo->lastInsertId();
        
        // Get the created volunteer
        $stmt = $pdo->prepare("SELECT * FROM volunteers WHERE id = ?");
        $stmt->execute([$volunteer_id]);
        $volunteer = $stmt->fetch();
        
        http_response_code(201);
        echo json_response(true, 'Volunteer created successfully', [
            'volunteer' => $volunteer
        ]);
    } else {
        throw new Exception('Failed to create volunteer');
    }
}

// Update existing volunteer
function handleUpdateVolunteer() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $volunteer_id = $input['id'] ?? null;
    
    if (!$volunteer_id) {
        http_response_code(400);
        echo json_response(false, 'Volunteer ID is required');
        return;
    }
    
    // Check if volunteer exists
    $stmt = $pdo->prepare("SELECT id FROM volunteers WHERE id = ?");
    $stmt->execute([$volunteer_id]);
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_response(false, 'Volunteer not found');
        return;
    }
    
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
    if (!validate_email($email)) $errors[] = 'Valid email is required';
    if (empty($skills)) $errors[] = 'Skills are required';
    if (empty($availability)) $errors[] = 'Availability is required';
    if (empty($area)) $errors[] = 'Area is required';
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_response(false, 'Validation failed', ['errors' => $errors]);
        return;
    }
    
    // Check if email is taken by another volunteer
    $stmt = $pdo->prepare("SELECT id FROM volunteers WHERE email = ? AND id != ?");
    $stmt->execute([$email, $volunteer_id]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_response(false, 'Email address is already taken by another volunteer');
        return;
    }
    
    // Update volunteer
    $sql = "UPDATE volunteers SET name = ?, email = ?, phone = ?, skills = ?, availability = ?, area = ? WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$name, $email, $phone, $skills, $availability, $area, $volunteer_id]);
    
    if ($result) {
        // Get the updated volunteer
        $stmt = $pdo->prepare("SELECT * FROM volunteers WHERE id = ?");
        $stmt->execute([$volunteer_id]);
        $volunteer = $stmt->fetch();
        
        http_response_code(200);
        echo json_response(true, 'Volunteer updated successfully', [
            'volunteer' => $volunteer
        ]);
    } else {
        throw new Exception('Failed to update volunteer');
    }
}

// Delete volunteer
function handleDeleteVolunteer() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $volunteer_id = $input['id'] ?? null;
    
    if (!$volunteer_id) {
        http_response_code(400);
        echo json_response(false, 'Volunteer ID is required');
        return;
    }
    
    // Check if volunteer exists
    $stmt = $pdo->prepare("SELECT name FROM volunteers WHERE id = ?");
    $stmt->execute([$volunteer_id]);
    $volunteer = $stmt->fetch();
    
    if (!$volunteer) {
        http_response_code(404);
        echo json_response(false, 'Volunteer not found');
        return;
    }
    
    // Delete volunteer
    $stmt = $pdo->prepare("DELETE FROM volunteers WHERE id = ?");
    $result = $stmt->execute([$volunteer_id]);
    
    if ($result) {
        http_response_code(200);
        echo json_response(true, 'Volunteer deleted successfully', [
            'deleted_volunteer' => $volunteer['name']
        ]);
    } else {
        throw new Exception('Failed to delete volunteer');
    }
}
?>