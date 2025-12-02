// Volunteers JavaScript

let allVolunteers = [];
let filteredVolunteers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeVolunteersPage();
    if (isRunningOnServer()) {
        loadAllVolunteers();
    } else {
        loadFallbackVolunteers();
    }
});

// Check if we're running on a proper web server
function isRunningOnServer() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

// Initialize volunteers page functionality
function initializeVolunteersPage() {
    // Initialize volunteer registration form
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', handleVolunteerRegistration);
    }
}

// Load all volunteers
async function loadAllVolunteers() {
    const volunteersList = document.getElementById('volunteersList');
    const volunteerCount = document.getElementById('volunteerCount');
    
    try {
        // Show loading state
        if (volunteersList) {
            volunteersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading volunteers...</p></div>';
        }
        
        // Fetch volunteers from backend
        allVolunteers = await fetchAllVolunteers();
        filteredVolunteers = [...allVolunteers];
        
        // Update count
        updateVolunteerCount();
        
        // Display volunteers
        displayVolunteers();
        
    } catch (error) {
        console.error('Error loading volunteers:', error);
        if (volunteersList) {
            volunteersList.innerHTML = '<div class="text-center"><p>Error loading volunteers. Please try again later.</p></div>';
        }
    }
}

// Load fallback volunteers for demo
function loadFallbackVolunteers() {
    console.warn('Website not accessed through web server - using fallback volunteer data');
    
    allVolunteers = [
        {
            id: 1,
            name: 'John',
            email: 'john@gmail.com',
            phone: '+91 234567890',
            skills: 'Plumbing, Electrical work, Basic construction',
            availability: 'Weekends',
            area: 'uppalli',
            created_at: '2025-01-10T10:00:00Z'
        },
        {
            id: 2,
            name: 'varun',
            email: 'varun@gmail.com',
            phone: '+91 234567891',
            skills: 'Community organizing, First aid, Event planning',
            availability: 'Evenings',
            area: 'kote',
            created_at: '2025-02-11T14:30:00Z'
        },
        {
            id: 3,
            name: 'anjali',
            email: 'anjaligmail.com',
            phone: '+91 234567892',
            skills: 'Construction, Road maintenance, Heavy equipment operation',
            availability: 'Flexible hours',
            area: 'undedasarahalli',
            created_at: '2025-03-12T09:15:00Z'
        },
        {
            id: 4,
            name: 'mohammad',
            email: 'mohammad@gmail.com',
            phone: '+91 234567893',
            skills: 'Environmental cleanup, Teaching, Project coordination',
            availability: 'Weekdays',
            area: 'uppalli',
            created_at: '2025-04-13T16:45:00Z'
        },
        {
            id: 5,
            name: 'David',
            email: 'david@gmail.com',
            phone: '+91 234567894',
            skills: 'IT support, Website maintenance, Database management',
            availability: 'Remote work',
            area: 'All areas',
            created_at: '2025-01-14T11:20:00Z'
        },
        {
            id: 6,
            name: 'fathima',
            email: 'fathima@gmail.com',
            phone: '+91 234567900',
            skills: 'Legal assistance, Documentation, Advocacy',
            availability: 'Weekends',
            area: 'vijayapura',
            created_at: '2025-06-15T13:30:00Z'
        },
         {
                id: 7,
                name: 'jayamma',
                email: 'jayamma@gmail.com',
                phone: '+91 234567901',
                skills: 'Photography, Social media, Marketing',
                availability: 'Evenings',
                area: 'gowrikalwe',
                created_at: '2025-07-16T08:10:00Z'
            },
            {
                id: 8,
                name: 'babu',
                email: 'babu@gmail.com',
                phone: '+91 234567902',
                skills: 'Nursing, First aid, Health education',
                availability: 'Flexible hours',
                area: 'All areas',
                created_at: '2025-08-17T15:00:00Z'
            }
    ];
    
    filteredVolunteers = [...allVolunteers];
    updateVolunteerCount();
    displayVolunteers();
}

// Get volunteers from PHP backend
async function fetchAllVolunteers() {
    try {
        const response = await fetch('includes/get_volunteers.php');
        const result = await response.json();
        
        if (result.success) {
            return result.data.volunteers;
        } else {
            throw new Error('Failed to fetch volunteers: ' + result.message);
        }
    } catch (error) {
        console.error('Error fetching volunteers from backend:', error);
        throw error;
    }
}

// Filter volunteers based on current filter settings
window.filterVolunteers = function() {
    const areaFilter = document.getElementById('areaFilter').value;
    const skillFilter = document.getElementById('skillFilter').value;
    const searchTerm = document.getElementById('volunteerSearch').value.toLowerCase().trim();
    
    // Start with all volunteers
    filteredVolunteers = [...allVolunteers];
    
    // Apply area filter
    if (areaFilter !== 'all') {
        filteredVolunteers = filteredVolunteers.filter(volunteer => 
            volunteer.area === areaFilter || volunteer.area === 'All areas'
        );
    }
    
    // Apply skill filter
    if (skillFilter !== 'all') {
        const skillKeywords = {
            'plumbing': ['plumbing', 'plumber', 'pipes'],
            'electrical': ['electrical', 'electric', 'wiring'],
            'construction': ['construction', 'building', 'repair'],
            'cleanup': ['cleanup', 'environmental', 'cleaning'],
            'organizing': ['organizing', 'coordination', 'planning', 'event'],
            'it': ['it', 'computer', 'website', 'database', 'tech'],
            'first_aid': ['first aid', 'medical', 'health', 'nursing']
        };
        
        const keywords = skillKeywords[skillFilter] || [skillFilter];
        filteredVolunteers = filteredVolunteers.filter(volunteer => 
            keywords.some(keyword => 
                volunteer.skills.toLowerCase().includes(keyword.toLowerCase())
            )
        );
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredVolunteers = filteredVolunteers.filter(volunteer => 
            volunteer.name.toLowerCase().includes(searchTerm) ||
            volunteer.skills.toLowerCase().includes(searchTerm) ||
            volunteer.area.toLowerCase().includes(searchTerm) ||
            volunteer.availability.toLowerCase().includes(searchTerm)
        );
    }
    
    // Update display
    updateVolunteerCount();
    displayVolunteers();
};

// Update volunteer count display
function updateVolunteerCount() {
    const volunteerCount = document.getElementById('volunteerCount');
    if (volunteerCount) {
        volunteerCount.textContent = filteredVolunteers.length;
    }
}

// Display volunteers
function displayVolunteers() {
    const volunteersList = document.getElementById('volunteersList');
    
    if (filteredVolunteers.length === 0) {
        volunteersList.innerHTML = '<div class="text-center"><p>No volunteers found matching your criteria.</p></div>';
        return;
    }
    
    // Generate HTML
    const volunteersHTML = filteredVolunteers.map(volunteer => createVolunteerCardHTML(volunteer)).join('');
    volunteersList.innerHTML = volunteersHTML;
}

// Create HTML for volunteer card
function createVolunteerCardHTML(volunteer) {
    const initials = getInitials(volunteer.name);
    const formattedDate = formatDate(volunteer.created_at);
    
    return `
        <div class="volunteer-card">
            <div class="volunteer-header">
                <div class="volunteer-avatar">${initials}</div>
                <div class="volunteer-name">${volunteer.name}</div>
            </div>
            <div class="volunteer-info">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${volunteer.area}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${volunteer.availability}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Joined ${formattedDate}</span>
                </div>
            </div>
            <div class="volunteer-skills">
                <h4>Skills & Expertise</h4>
                <p>${volunteer.skills}</p>
            </div>
            <div class="volunteer-actions">
                <button class="btn btn-primary" onclick="contactVolunteer(${volunteer.id})">
                    <i class="fas fa-envelope"></i> Contact
                </button>
                <button class="btn btn-secondary" onclick="viewVolunteerProfile(${volunteer.id})">
                    <i class="fas fa-user"></i> Profile
                </button>
            </div>
        </div>
    `;
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
}

// Format date (reuse from main.js)
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

// Contact volunteer
window.contactVolunteer = function(volunteerId) {
    const volunteer = allVolunteers.find(v => v.id === volunteerId);
    if (!volunteer) {
        showToast('Volunteer not found', 'error');
        return;
    }
    
    // Populate contact modal
    document.getElementById('contactInfo').innerHTML = `
        <div class="volunteer-contact-info">
            <h4>${volunteer.name}</h4>
            <p><strong>Area:</strong> ${volunteer.area}</p>
            <p><strong>Skills:</strong> ${volunteer.skills}</p>
            <p><strong>Availability:</strong> ${volunteer.availability}</p>
        </div>
    `;
    
    // Update contact buttons
    document.getElementById('emailContact').href = `mailto:${volunteer.email}?subject=Volunteer Request&body=Dear ${volunteer.name.split(' ')[0]},\\n\\nI would like to request your volunteer assistance for a community issue.\\n\\nBest regards`;
    document.getElementById('phoneContact').href = `tel:${volunteer.phone}`;
    
    // Show modal
    document.getElementById('contactModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// View volunteer profile
window.viewVolunteerProfile = function(volunteerId) {
    const volunteer = allVolunteers.find(v => v.id === volunteerId);
    if (!volunteer) {
        showToast('Volunteer not found', 'error');
        return;
    }
    
    // For now, just show contact modal with more details
    contactVolunteer(volunteerId);
};

// Close contact modal
window.closeContactModal = function() {
    document.getElementById('contactModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// Open volunteer registration modal
window.openVolunteerModal = function() {
    document.getElementById('volunteerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('volName').focus();
    }, 100);
};

// Close volunteer registration modal
window.closeVolunteerModal = function() {
    document.getElementById('volunteerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('volunteerForm').reset();
    clearAllErrors();
};

// Handle volunteer registration
async function handleVolunteerRegistration(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateVolunteerForm()) {
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        // Extract form data
        const volunteerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            skills: formData.get('skills'),
            availability: formData.get('availability'),
            area: formData.get('area')
        };

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let result;
        
        if (isRunningOnServer()) {
            // Submit to PHP backend
            const response = await fetch('includes/register_volunteer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(volunteerData)
            });
            result = await response.json();
        } else {
            // Simulate success for demo
            result = {
                success: true,
                message: 'Demo: Volunteer registration would be successful',
                data: {
                    volunteer: {
                        id: Date.now(),
                        ...volunteerData,
                        created_at: new Date().toISOString()
                    }
                }
            };
        }
        
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;

        if (result.success) {
            // Show success
            showToast('Volunteer registration submitted successfully!', 'success');
            closeVolunteerModal();
            
            // Update local arrays with new volunteer
            allVolunteers.unshift(result.data.volunteer);
            filteredVolunteers = [...allVolunteers];
            updateVolunteerCount();
            displayVolunteers();
        } else {
            // Show errors
            if (result.data && result.data.errors) {
                result.data.errors.forEach(error => showToast(error, 'error'));
            } else {
                showToast(result.message || 'Failed to register volunteer. Please try again.', 'error');
            }
        }

    } catch (error) {
        console.error('Volunteer registration error:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
    }
}

// Validate volunteer registration form
function validateVolunteerForm() {
    clearAllErrors();
    let isValid = true;
    
    // Name validation
    const name = document.getElementById('volName').value.trim();
    if (!name) {
        showError('volName', 'Name is required.');
        isValid = false;
    } else if (name.length < 2) {
        showError('volName', 'Name must be at least 2 characters long.');
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('volEmail').value.trim();
    if (!email) {
        showError('volEmail', 'Email is required.');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('volEmail', 'Please enter a valid email address.');
        isValid = false;
    }
    
    // Phone validation
    const phone = document.getElementById('volPhone').value.trim();
    if (!phone) {
        showError('volPhone', 'Phone number is required.');
        isValid = false;
    } else if (!validatePhone(phone)) {
        showError('volPhone', 'Please enter a valid phone number.');
        isValid = false;
    }
    
    // Skills validation
    const skills = document.getElementById('volSkills').value.trim();
    if (!skills) {
        showError('volSkills', 'Please describe your skills and expertise.');
        isValid = false;
    } else if (skills.length < 10) {
        showError('volSkills', 'Please provide a more detailed description of your skills.');
        isValid = false;
    }
    
    // Agreement validation
    const agree = document.getElementById('volAgree').checked;
    if (!agree) {
        showError('volAgree', 'You must agree to be contacted for volunteer opportunities.');
        isValid = false;
    }
    
    return isValid;
}

// Show error for volunteer form
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Create or update error message
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    field.style.borderColor = '#e74c3c';
}

// Clear error for volunteer form
function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    field.style.borderColor = '#e9ecef';
}

// Clear all errors
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
    
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.style.borderColor = '#e9ecef';
    });
}

// Email validation (reuse from main.js)
function validateEmail(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation (reuse from main.js)
function validatePhone(phone) {
    const phoneRegex = /^[\\+]?[1-9][\\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\\s\\-\\(\\)]/g, ''));
}

// Show toast notification (reuse from main.js)
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        cursor: pointer;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
                if (container.children.length === 0) {
                    document.body.removeChild(container);
                }
            }
        }, 300);
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
                if (container.children.length === 0) {
                    document.body.removeChild(container);
                }
            }
        }, 300);
    });
}

// Form submission handler (simplified version from main.js)
function handleFormSubmission(form, successCallback, errorCallback) {
    return new Promise((resolve, reject) => {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Simulate form submission
        setTimeout(() => {
            try {
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
                
                // Success
                const response = {
                    success: true,
                    message: 'Registration successful!',
                    id: Math.floor(Math.random() * 10000)
                };
                
                if (successCallback) {
                    successCallback(response);
                }
                resolve(response);
            } catch (error) {
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
                
                if (errorCallback) {
                    errorCallback(error);
                }
                reject(error);
            }
        }, 2000);
    });
}

console.log('Volunteers JS Loaded Successfully');