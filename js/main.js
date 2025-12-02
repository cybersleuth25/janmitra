// Local Issues Reporter - Main JavaScript File - Node.js/MongoDB Connected

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

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || hamburger.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// Initialize animated counters
function initializeCounters() {
    const counters = document.querySelectorAll('[id$="Issues"], [id$="Volunteers"]');
    
    if (counters.length > 0) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target) || 0;
    const duration = 2000;
    const increment = target / (duration / 16);
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
}

// Form validation utilities
function initializeFormValidation() {
    window.validateEmail = function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    window.validatePhone = function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    };

    window.showError = function(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const fieldElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        if (fieldElement) fieldElement.style.borderColor = '#e74c3c';
    };

    window.clearAllErrors = function() {
        document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        document.querySelectorAll('input, select, textarea').forEach(f => f.style.borderColor = '#e9ecef');
    };
}

// Load initial data
function loadInitialData() {
    loadStatistics();
    if (document.getElementById('recentIssuesList')) {
        loadRecentIssues();
    }
}

// Load statistics from Node.js API
async function loadStatistics() {
    try {
        // CHANGED: Pointing to new Node.js endpoint
        const response = await fetch('/api/issues/stats/summary');
        const stats = await response.json();
        
        // Map the API response to the HTML IDs
        const elements = {
            totalIssues: stats.totalIssues,
            resolvedIssues: stats.resolvedIssues,
            activeVolunteers: stats.activeVolunteers,
            inProgressIssues: stats.inProgressIssues
        };

        Object.entries(elements).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.dataset.target = value || 0;
                // Trigger animation manually if already in view or just set text
                element.textContent = value || 0;
            }
        });
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load recent issues from Node.js API
async function loadRecentIssues() {
    const container = document.getElementById('recentIssuesList');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        // CHANGED: Pointing to new Node.js endpoint
        const response = await fetch('/api/issues?limit=3');
        const data = await response.json();
        const issues = data.issues || []; // Node returns { issues: [...] }
        
        if (issues.length === 0) {
            container.innerHTML = '<div class="text-center"><p>No recent issues found.</p></div>';
            return;
        }

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
        container.innerHTML = '<div class="text-center"><p>Error loading issues.</p></div>';
    }
}

// Create HTML for issue card
function createIssueCardHTML(issue) {
    // Handle field naming differences (MongoDB uses createdAt, SQL used created_at)
    const dateStr = issue.createdAt || issue.created_at;
    const status = (issue.status || 'Open').toLowerCase();
    const statusClass = status.replace('_', '-');
    const categoryIcon = getCategoryIcon(issue.category);
    const formattedDate = formatDate(dateStr);
    const location = issue.location || issue.address || 'Unknown Location';
    const reporter = issue.reporter_name || issue.name || 'Anonymous';
    
    return `
        <div class="issue-card status-${statusClass}" data-issue-id="${issue.id || issue._id}">
            <div class="issue-header">
                <div>
                    <div class="issue-title">
                        ${categoryIcon} ${truncateText(issue.title, 50)}
                    </div>
                    <div class="issue-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${truncateText(location, 30)}</span>
                        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="fas fa-user"></i> ${reporter}</span>
                    </div>
                </div>
                <div class="status-badge ${status}">${formatStatus(status)}</div>
            </div>
            <div class="issue-description">
                ${truncateText(issue.description, 120)}
            </div>
            <div class="issue-footer">
                <div class="issue-category">
                    <i class="fas fa-tag"></i> ${formatCategory(issue.category)}
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
        other: '<i class="fas fa-exclamation-circle"></i>'
    };
    return icons[category] || icons.other;
}

function formatCategory(category) {
    return (category || 'Other').charAt(0).toUpperCase() + (category || 'Other').slice(1).replace('_', ' ');
}

function formatStatus(status) {
    return (status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1).replace('_', ' ');
}

function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

console.log('Main JS Loaded (MongoDB Version)');