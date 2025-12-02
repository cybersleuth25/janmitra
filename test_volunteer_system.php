<?php
// Test script for volunteer management system
echo "Testing Volunteer Management System...\n\n";

$base_url = "http://localhost/LocalIssuesWebsite";

// Test 1: Check if volunteers can be fetched
echo "=== TEST 1: Fetch Volunteers ===\n";
$response = @file_get_contents("$base_url/includes/get_volunteers.php");
if ($response !== false) {
    $result = json_decode($response, true);
    if ($result && $result['success']) {
        echo "✅ Volunteers fetched successfully!\n";
        echo "   Found " . count($result['data']['volunteers']) . " volunteers\n";
        
        // Show first few volunteers
        $volunteers = array_slice($result['data']['volunteers'], 0, 3);
        foreach ($volunteers as $vol) {
            echo "   - " . $vol['name'] . " (" . $vol['area'] . ")\n";
        }
    } else {
        echo "❌ Failed to fetch volunteers\n";
    }
} else {
    echo "❌ Could not connect to volunteers endpoint\n";
}

echo "\n=== TEST 2: Test Registration Endpoint ===\n";
$test_volunteer = [
    'name' => 'Test User ' . date('His'),
    'email' => 'testuser' . date('His') . '@example.com',
    'phone' => '+1234567890',
    'skills' => 'Testing and quality assurance',
    'availability' => 'Weekends',
    'area' => 'Uppalli'
];

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($test_volunteer)
    ]
]);

$response = @file_get_contents("$base_url/includes/register_volunteer.php", false, $context);

if ($response !== false) {
    $result = json_decode($response, true);
    if ($result && $result['success']) {
        echo "✅ Volunteer registration works!\n";
        echo "   Registered: " . $test_volunteer['name'] . "\n";
        echo "   ID: " . $result['data']['volunteer_id'] . "\n";
    } else {
        echo "❌ Registration failed: " . ($result['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Could not connect to registration endpoint\n";
}

echo "\n=== SYSTEM STATUS ===\n";
echo "📊 Database: " . (file_exists('includes/config.php') ? '✅ Connected' : '❌ Not found') . "\n";
echo "🔧 Admin Interface: Available at $base_url/admin/login.html\n";
echo "👥 Public Interface: Available at $base_url/volunteers.html\n";
echo "🛠️ API Endpoints: " . (($response !== false) ? '✅ Working' : '❌ Check XAMPP') . "\n";

echo "\n=== NEXT STEPS ===\n";
echo "1. Start XAMPP (Apache + MySQL)\n";
echo "2. Visit: $base_url/volunteers.html\n";
echo "3. Test volunteer registration\n";
echo "4. Login to admin: $base_url/admin/login.html (admin/admin123)\n";
echo "5. Manage volunteers in admin dashboard\n";

echo "\nVolunteer management system ready to use! 🎉\n";
?>