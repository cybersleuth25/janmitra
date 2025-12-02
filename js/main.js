// Local Issues Reporter - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCounters();
    initializeFormValidation();
    loadInitialData();
});

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || hamburger.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// Initialize animated counters for statistics
function initializeCounters() {
    const counters = document.querySelectorAll('[id$="Issues"], [id$="Volunteers"]');
    
    if (counters.length > 0) {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }
}

// Animate counter from 0 to target value
function animateCounter(element) {
    const target = parseInt(element.dataset.target) || getRandomCount();
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60 FPS
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);

    // Store the target for future reference
    element.dataset.target = target;
}

// Get random count for demo purposes
function getRandomCount() {
    const ranges = {
        totalIssues: [45, 120],
        resolvedIssues: [20, 80],
        activeVolunteers: [15, 35],
        inProgressIssues: [5, 25]
    };

    const elementId = event?.target?.id || 'totalIssues';
    const range = ranges[elementId] || ranges.totalIssues;
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

// Form validation utilities
function initializeFormValidation() {
    // Email validation
    window.validateEmail = function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Phone validation
    window.validatePhone = function(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    };

    // Show error message
    window.showError = function(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const fieldElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (fieldElement) {
            fieldElement.style.borderColor = '#e74c3c';
        }
    };

    // Clear error message
    window.clearError = function(fieldId) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const fieldElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (fieldElement) {
            fieldElement.style.borderColor = '#e9ecef';
        }
    };

    // Clear all form errors
    window.clearAllErrors = function() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '#e9ecef';
        });
    };
}

// Check if we're running on a proper web server
function isRunningOnServer() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

// Load initial data for homepage
function loadInitialData() {
    if (!isRunningOnServer()) {
        console.warn('Website not accessed through web server - using fallback data');
        setFallbackStats();
        loadFallbackRecentIssues();
        return;
    }
    
    // Load statistics
    loadStatistics();
    
    // Load recent issues if on homepage
    if (document.getElementById('recentIssuesList')) {
        loadRecentIssues();
    }
}

// Load and display statistics
async function loadStatistics() {
    try {
        // In a real application, this would fetch from the server
        const stats = await fetchStatistics();
        
        // Update counter elements
        const elements = {
            totalIssues: document.getElementById('totalIssues'),
            resolvedIssues: document.getElementById('resolvedIssues'),
            activeVolunteers: document.getElementById('activeVolunteers'),
            inProgressIssues: document.getElementById('inProgressIssues')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                element.dataset.target = stats[key] || getRandomCount();
            }
        });
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback to random numbers for demo
        setFallbackStats();
    }
}

// Get statistics from PHP backend
async function fetchStatistics() {
    try {
        const response = await fetch('includes/get_stats.php');
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            return {
                totalIssues: data.issues.total,
                resolvedIssues: data.issues.resolved,
                activeVolunteers: data.volunteers.total,
                inProgressIssues: data.issues.in_progress
            };
        } else {
            throw new Error('Failed to fetch statistics: ' + result.message);
        }
    } catch (error) {
        console.error('Error fetching statistics from backend:', error);
        throw error;
    }
}

// Set fallback statistics for demo
function setFallbackStats() {
    const stats = {
        totalIssues: 87,
        resolvedIssues: 52,
        activeVolunteers: 23,
        inProgressIssues: 18
    };

    Object.entries(stats).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.dataset.target = value;
        }
    });
}

// Load fallback recent issues for demo
function loadFallbackRecentIssues() {
    const container = document.getElementById('recentIssuesList');
    if (!container) return;
    
    const fallbackIssues = [
        {
            id: 1,
            title: 'Large pothole on Main Street',
            category: 'pothole',
            status: 'open',
            location: 'uppalli Main Street,chikkamagaluru,karnataka',
            description: 'Large pothole causing vehicle damage',
            created_at: new Date().toISOString(),
            reporter: 'Local Resident'
        },
        {
            id: 2,
            title: 'Street light malfunction',
            category: 'streetlight',
            status: 'in_progress',
            location: 'vaijayapura main road',
            description: 'Street light flickering intermittently',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            reporter: 'Community Member'
        },
        {
            id: 3,
            title: 'Water supply issues',
            category: 'water_supply',
            status: 'open',
            location: 'undedasarahalli',
            description: 'Irregular water supply affecting multiple homes',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            reporter: 'Neighborhood Group'
        }
    ];
    
    const issuesHTML = fallbackIssues.map(issue => createIssueCardHTML(issue)).join('');
    container.innerHTML = issuesHTML;
    
    // Add click handlers
    container.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('click', () => {
            const issueId = card.dataset.issueId;
            showMessage('Demo Mode', 'This is demo data. Please access via http://localhost for full functionality.', 'info');
        });
    });
}

// Load recent issues for homepage
async function loadRecentIssues() {
    const container = document.getElementById('recentIssuesList');
    if (!container) return;

    try {
        // Show loading state
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading recent issues...</p></div>';

        // Simulate API call (replace with actual fetch)
        const issues = await fetchRecentIssues();
        
        if (issues.length === 0) {
            container.innerHTML = '<div class="text-center"><p>No recent issues found.</p></div>';
            return;
        }

        // Generate HTML for issues
        const issuesHTML = issues.map(issue => createIssueCardHTML(issue)).join('');
        container.innerHTML = issuesHTML;

        // Add click handlers
        container.querySelectorAll('.issue-card').forEach(card => {
            card.addEventListener('click', () => {
                const issueId = card.dataset.issueId;
                window.location.href = `view-issues.html?id=${issueId}`;
            });
        });

    } catch (error) {
        console.error('Error loading recent issues:', error);
        container.innerHTML = '<div class="text-center"><p>Error loading issues. Please try again later.</p></div>';
    }
}

// Get recent issues from PHP backend
async function fetchRecentIssues() {
    try {
        const response = await fetch('includes/get_issues.php?limit=3');
        const result = await response.json();
        
        if (result.success) {
            return result.data.issues.map(issue => ({
                id: issue.id,
                title: issue.title,
                category: issue.category,
                status: issue.status,
                location: issue.address,
                description: issue.description,
                created_at: issue.created_at,
                reporter: issue.name
            }));
        } else {
            throw new Error('Failed to fetch recent issues: ' + result.message);
        }
    } catch (error) {
        console.error('Error fetching recent issues from backend:', error);
        throw error;
    }
}

// Create HTML for issue card
function createIssueCardHTML(issue) {
    const statusClass = issue.status.replace('_', '-');
    const categoryIcon = getCategoryIcon(issue.category);
    const formattedDate = formatDate(issue.created_at);
    
    return `
        <div class="issue-card status-${statusClass}" data-issue-id="${issue.id}">
            <div class="issue-header">
                <div>
                    <div class="issue-title">
                        ${categoryIcon} ${truncateText(issue.title, 50)}
                    </div>
                    <div class="issue-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${truncateText(issue.location, 30)}</span>
                        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="fas fa-user"></i> ${issue.reporter}</span>
                    </div>
                </div>
                <div class="status-badge ${issue.status}">${formatStatus(issue.status)}</div>
            </div>
            <div class="issue-description">
                ${truncateText(issue.description, 120)}
            </div>
            <div class="issue-footer">
                <div class="issue-category">
                    <i class="fas fa-tag"></i> ${formatCategory(issue.category)}
                </div>
                <div class="issue-actions">
                    <span class="view-details">View Details <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </div>
    `;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        pothole: '<i class="fas fa-road"></i>',
        streetlight: '<i class="fas fa-lightbulb"></i>',
        water_supply: '<i class="fas fa-tint"></i>',
        garbage: '<i class="fas fa-trash"></i>',
        public_transport: '<i class="fas fa-bus"></i>',
        sidewalk: '<i class="fas fa-walking"></i>',
        traffic: '<i class="fas fa-traffic-light"></i>',
        noise: '<i class="fas fa-volume-up"></i>',
        park: '<i class="fas fa-tree"></i>',
        other: '<i class="fas fa-exclamation-circle"></i>'
    };
    return icons[category] || icons.other;
}

// Format category name
function formatCategory(category) {
    const names = {
        pothole: 'Pothole',
        streetlight: 'Street Light',
        water_supply: 'Water Supply',
        garbage: 'Garbage',
        public_transport: 'Public Transport',
        sidewalk: 'Sidewalk',
        traffic: 'Traffic',
        noise: 'Noise',
        park: 'Parks',
        other: 'Other'
    };
    return names[category] || 'Other';
}

// Format status
function formatStatus(status) {
    const statuses = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved'
    };
    return statuses[status] || 'Unknown';
}

// Format date
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

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Utility functions for modals
window.showModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
};

window.hideModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            openModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
});

// Category card click handlers
document.addEventListener('DOMContentLoaded', function() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            if (category) {
                window.location.href = `report-issue.html?category=${category}`;
            }
        });
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
window.handleFormSubmission = async function(form, successCallback, errorCallback) {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Simulate form submission (replace with actual fetch)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Success callback
        if (successCallback) {
            successCallback({
                success: true,
                message: 'Form submitted successfully!',
                id: Math.floor(Math.random() * 10000)
            });
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        // Error callback
        if (errorCallback) {
            errorCallback({
                success: false,
                message: 'An error occurred. Please try again.'
            });
        }
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
};

// Local storage utilities
window.LocalStorage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Toast notification system
window.showToast = function(message, type = 'info', duration = 3000) {
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
            container.removeChild(toast);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            container.removeChild(toast);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    });
};

console.log('Local Issues Reporter - Main JS Loaded Successfully');