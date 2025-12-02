// View Issues JavaScript

let allIssues = [];
let filteredIssues = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    initializeViewIssues();
    loadAllIssues();
});

// Initialize view issues functionality
function initializeViewIssues() {
    // Check for specific issue ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const issueId = urlParams.get('id');
    
    if (issueId) {
        // If specific issue ID is provided, show that issue's details
        setTimeout(() => {
            showIssueDetails(parseInt(issueId));
        }, 1000);
    }
}

// Load all issues
async function loadAllIssues() {
    const issuesList = document.getElementById('issuesList');
    const issuesCount = document.getElementById('issuesCount');
    
    try {
        // Show loading state
        issuesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading issues...</p></div>';
        
        // Simulate API call (replace with actual fetch)
        allIssues = await fetchAllIssues();
        filteredIssues = [...allIssues];
        
        // Update count
        updateIssuesCount();
        
        // Display issues
        displayIssues();
        
        // Setup pagination
        setupPagination();
        
    } catch (error) {
        console.error('Error loading issues:', error);
        issuesList.innerHTML = '<div class="text-center"><p>Error loading issues. Please try again later.</p></div>';
    }
}

// Get issues from PHP backend
async function fetchAllIssues() {
    try {
        const response = await fetch('includes/get_issues.php');
        const result = await response.json();
        
        if (result.success) {
            return result.data.issues;
        } else {
            throw new Error('Failed to fetch issues: ' + result.message);
        }
    } catch (error) {
        console.error('Error fetching issues from backend:', error);
        throw error;
    }
}

// Filter issues based on current filter settings
window.filterIssues = function() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    // Start with all issues
    filteredIssues = [...allIssues];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredIssues = filteredIssues.filter(issue => 
            issue.title.toLowerCase().includes(searchTerm) ||
            issue.description.toLowerCase().includes(searchTerm) ||
            issue.address.toLowerCase().includes(searchTerm) ||
            issue.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    filteredIssues.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'status':
                const statusOrder = { 'open': 0, 'in_progress': 1, 'resolved': 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Update display
    updateIssuesCount();
    displayIssues();
    setupPagination();
};

// Update issues count display
function updateIssuesCount() {
    const issuesCount = document.getElementById('issuesCount');
    if (issuesCount) {
        issuesCount.textContent = filteredIssues.length;
    }
}

// Display issues for current page
function displayIssues() {
    const issuesList = document.getElementById('issuesList');
    
    if (filteredIssues.length === 0) {
        issuesList.innerHTML = '<div class="text-center"><p>No issues found matching your criteria.</p></div>';
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const issuesToShow = filteredIssues.slice(startIndex, endIndex);
    
    // Generate HTML
    const issuesHTML = issuesToShow.map(issue => createIssueCardHTML(issue)).join('');
    issuesList.innerHTML = issuesHTML;
    
    // Add click handlers
    issuesList.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('click', () => {
            const issueId = parseInt(card.dataset.issueId);
            showIssueDetails(issueId);
        });
    });
}

// Create HTML for issue card (reusing from main.js but with more details)
function createIssueCardHTML(issue) {
    const statusClass = issue.status.replace('_', '-');
    const categoryIcon = getCategoryIcon(issue.category);
    const formattedDate = formatDate(issue.created_at);
    
    return `
        <div class="issue-card status-${statusClass}" data-issue-id="${issue.id}">
            <div class="issue-header">
                <div>
                    <div class="issue-title">
                        ${categoryIcon} ${truncateText(issue.title, 60)}
                    </div>
                    <div class="issue-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${truncateText(issue.address, 40)}</span>
                        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="fas fa-user"></i> ${issue.name}</span>
                    </div>
                </div>
                <div class="status-badge ${issue.status}">${formatStatus(issue.status)}</div>
            </div>
            <div class="issue-description">
                ${truncateText(issue.description, 150)}
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

// Setup pagination
function setupPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<button disabled>...</button>';
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button ${i === currentPage ? 'class="active"' : ''} onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Last page and ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<button disabled>...</button>';
        }
        paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(filteredIssues.length / itemsPerPage)) return;
    
    currentPage = page;
    displayIssues();
    setupPagination();
    
    // Scroll to top of issues list
    document.getElementById('issuesList').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
};

// Show issue details modal
function showIssueDetails(issueId) {
    const issue = allIssues.find(i => i.id === issueId);
    if (!issue) {
        showToast('Issue not found', 'error');
        return;
    }
    
    // Populate modal with issue details
    document.getElementById('detailId').textContent = `#${issue.id}`;
    document.getElementById('detailStatus').textContent = formatStatus(issue.status);
    document.getElementById('detailStatus').className = `status-badge ${issue.status}`;
    document.getElementById('detailCategory').textContent = formatCategory(issue.category);
    document.getElementById('detailDate').textContent = formatDateTime(issue.created_at);
    
    document.getElementById('detailAddress').textContent = issue.address;
    document.getElementById('detailDescription').textContent = issue.description;
    
    document.getElementById('detailName').textContent = issue.name;
    document.getElementById('detailEmail').textContent = issue.email;
    
    // Handle optional phone number
    const phoneContainer = document.getElementById('detailPhoneContainer');
    const phoneElement = document.getElementById('detailPhone');
    if (issue.phone) {
        phoneElement.textContent = issue.phone;
        phoneContainer.style.display = 'block';
    } else {
        phoneContainer.style.display = 'none';
    }
    
    // Handle optional photo
    const photoContainer = document.getElementById('detailPhotoContainer');
    const photoElement = document.getElementById('detailPhoto');
    if (issue.photo_path) {
        photoElement.src = issue.photo_path;
        photoContainer.style.display = 'block';
    } else {
        photoContainer.style.display = 'none';
    }
    
    // Update contact reporter button
    const contactBtn = document.getElementById('contactReporterBtn');
    contactBtn.href = `mailto:${issue.email}?subject=Regarding Issue #${issue.id}: ${issue.title}&body=Dear ${issue.name.split(' ')[0]},\\n\\nI am contacting you regarding the issue you reported: "${issue.title}"\\n\\nLocation: ${issue.address}\\n\\nBest regards`;
    
    // Show modal
    document.getElementById('issueModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close issue details modal
window.closeIssueModal = function() {
    document.getElementById('issueModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get category icon (reuse from main.js)
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

// Format category name (reuse from main.js)
function formatCategory(category) {
    const names = {
        pothole: 'Potholes & Road Damage',
        streetlight: 'Street Lighting',
        water_supply: 'Water Supply Issues',
        garbage: 'Garbage & Waste Management',
        public_transport: 'Public Transportation',
        sidewalk: 'Sidewalk & Walkways',
        traffic: 'Traffic Signals & Signs',
        noise: 'Noise Complaints',
        park: 'Parks & Recreation',
        other: 'Other Issues'
    };
    return names[category] || 'Other';
}

// Format status (reuse from main.js)
function formatStatus(status) {
    const statuses = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved'
    };
    return statuses[status] || 'Unknown';
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

// Truncate text (reuse from main.js)
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export issue data using dataManager
window.exportIssues = function() {
    const csvContent = window.dataManager.exportIssuesAsCSV();
    const filename = `local_issues_${new Date().toISOString().split('T')[0]}.csv`;
    window.dataManager.downloadFile(csvContent, filename, 'text/csv');
    showToast('Issues exported successfully!', 'success');
};

// Convert issues to CSV format
function convertToCSV(issues) {
    const headers = ['ID', 'Title', 'Category', 'Status', 'Address', 'Description', 'Reporter Name', 'Reporter Email', 'Reporter Phone', 'Created Date'];
    const csvRows = [headers.join(',')];
    
    issues.forEach(issue => {
        const row = [
            issue.id,
            `"${issue.title.replace(/"/g, '""')}"`,
            issue.category,
            issue.status,
            `"${issue.address.replace(/"/g, '""')}"`,
            `"${issue.description.replace(/"/g, '""')}"`,
            `"${issue.name.replace(/"/g, '""')}"`,
            issue.email,
            issue.phone || '',
            new Date(issue.created_at).toLocaleDateString()
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\\n');
}

console.log('View Issues JS Loaded Successfully');