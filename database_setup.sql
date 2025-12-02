-- Local Issues Reporting Database Setup
-- Run this SQL in your MySQL database through phpMyAdmin or command line

CREATE DATABASE IF NOT EXISTS local_issues_db;
USE local_issues_db;

-- Issues table (updated schema to match frontend)
CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    photo_path VARCHAR(255),
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    skills TEXT,
    availability VARCHAR(255),
    area VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table for better security
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    admin_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Municipal council users table
CREATE TABLE IF NOT EXISTS council_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    role ENUM('councilor', 'department_head', 'staff') DEFAULT 'councilor',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Municipal council sessions table
CREATE TABLE IF NOT EXISTS council_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    council_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (council_user_id) REFERENCES council_users(id) ON DELETE CASCADE
);

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO admin_users (username, password, email) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@localissues.com')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Insert sample municipal council users
INSERT INTO council_users (username, password, full_name, email, department, role) VALUES
('council.mayor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mayor John Anderson', 'mayor@municipality.gov', 'Mayor Office', 'councilor'),
('council.public_works', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Wilson', 'publicworks@municipality.gov', 'Public Works', 'department_head'),
('council.utilities', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael Davis', 'utilities@municipality.gov', 'Utilities Department', 'department_head'),
('council.health', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Emily Chen', 'health@municipality.gov', 'Health Department', 'department_head'),
('council.transport', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Robert Martinez', 'transport@municipality.gov', 'Transportation', 'department_head')
ON DUPLICATE KEY UPDATE 
    full_name = VALUES(full_name),
    email = VALUES(email),
    department = VALUES(department);

-- Insert sample volunteers
INSERT INTO volunteers (name, email, phone, skills, availability, area) VALUES
('John Smith', 'john.smith@email.com', '+1234567890', 'Plumbing, Electrical work, Basic construction', 'Weekends', 'Downtown'),
('Sarah Johnson', 'sarah.j@email.com', '+1234567891', 'Community organizing, First aid, Event planning', 'Evenings', 'North Side'),
('Mike Davis', 'mike.davis@email.com', '+1234567892', 'Construction, Road maintenance, Heavy equipment operation', 'Flexible hours', 'South Side'),
('Emily Brown', 'emily.brown@email.com', '+1234567893', 'Environmental cleanup, Teaching, Project coordination', 'Weekdays', 'East Side'),
('David Wilson', 'david.wilson@email.com', '+1234567894', 'IT support, Website maintenance, Database management', 'Remote work', 'All areas'),
('Lisa Garcia', 'lisa.garcia@email.com', '+1234567900', 'Legal assistance, Documentation, Advocacy', 'Weekends', 'Downtown'),
('Robert Chen', 'robert.chen@email.com', '+1234567901', 'Photography, Social media, Marketing', 'Evenings', 'North Side'),
('Amanda Taylor', 'amanda.taylor@email.com', '+1234567902', 'Nursing, First aid, Health education', 'Flexible hours', 'All areas')
ON DUPLICATE KEY UPDATE 
    skills = VALUES(skills), 
    availability = VALUES(availability);

-- Insert sample issues for demonstration
INSERT INTO issues (title, name, email, phone, address, category, description, status, created_at) VALUES
('Large pothole on Main Street', 'Alice Cooper', 'alice.cooper@email.com', '+1234567895', '123 Main Street, near the intersection with Oak Avenue', 'pothole', 'There is a large pothole that has formed on Main Street, right near the intersection with Oak Avenue. The pothole is approximately 2 feet wide and 6 inches deep, causing significant damage to vehicles that drive over it. Multiple residents have reported tire damage, and it poses a safety hazard, especially during nighttime when visibility is poor.', 'open', '2025-01-15 10:30:00'),
('Street light malfunction on Oak Avenue', 'Bob Johnson', 'bob.johnson@email.com', '+1234567896', '456 Oak Avenue, in front of the community center', 'streetlight', 'The street light in front of the community center on Oak Avenue has been malfunctioning for the past 3 weeks. It flickers intermittently and sometimes goes completely dark, creating safety concerns for pedestrians and drivers, especially during evening hours when community events are held.', 'in_progress', '2025-01-12 14:45:00'),
('Irregular water supply affecting Pine Road', 'Carol Davis', 'carol.davis@email.com', '+1234567897', '789 Pine Road and surrounding area', 'water_supply', 'Residents on Pine Road and the surrounding blocks have been experiencing irregular water supply for the past week. Water pressure is very low during morning hours (6-10 AM) and completely cuts off in the evenings (7-9 PM). This is affecting daily activities and has become a major inconvenience for families in the area.', 'open', '2025-01-10 08:15:00'),
('Illegal garbage dumping in vacant lot', 'Dan Brown', 'dan.brown@email.com', '+1234567898', '321 Elm Street, vacant lot behind the shopping plaza', 'garbage', 'There has been ongoing illegal garbage dumping in the vacant lot behind the shopping plaza on Elm Street. Large items including furniture, appliances, and construction debris have been dumped there regularly. This has attracted pests and creates an unsightly and unhealthy environment for the surrounding businesses and residents.', 'resolved', '2025-01-08 16:20:00'),
('Bus stop damage on Central Avenue', 'Emma Wilson', 'emma.wilson@email.com', '+1234567899', 'Central Avenue bus stop, Route 15', 'public_transport', 'The bus stop shelter on Central Avenue (Route 15) has been severely damaged, likely due to recent storms. The roof is partially collapsed, the seating is broken, and there are sharp metal edges exposed. This poses a safety risk to commuters who use this heavily trafficked bus stop daily.', 'open', '2025-01-14 12:10:00'),
('Sidewalk cracks creating tripping hazard', 'Frank Martinez', 'frank.martinez@email.com', NULL, 'Maple Street sidewalk, between 2nd and 3rd Avenue', 'sidewalk', 'The sidewalk on Maple Street between 2nd and 3rd Avenue has developed several large cracks and uneven surfaces that create significant tripping hazards. This is particularly dangerous for elderly residents and people with mobility issues who frequent this area to access the nearby medical center.', 'in_progress', '2025-01-11 09:45:00')
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description),
    status = VALUES(status);

-- Create indexes for better performance
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created ON issues(created_at);
CREATE INDEX idx_volunteers_area ON volunteers(area);
CREATE INDEX idx_volunteers_email ON volunteers(email);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
