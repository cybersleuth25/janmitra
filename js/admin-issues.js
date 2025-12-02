document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadIssues();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    // If not logged in, go back to login page
    if (!token) window.location.href = 'login.html';
}

async function loadIssues() {
    const loader = document.getElementById('loading');
    const table = document.getElementById('issuesTable');
    const tbody = document.getElementById('issuesBody');

    try {
        // 1. Fetch data (with timestamp to prevent caching)
        const response = await fetch('/api/issues?limit=100&_=' + Date.now());
        const result = await response.json();

        if (!result.issues) throw new Error('Failed to load issues from server');

        // 2. Clear existing table rows
        tbody.innerHTML = '';

        // 3. Populate Table
        result.issues.forEach(issue => {
            const tr = document.createElement('tr');
            
            // Handle potential missing fields
            const title = issue.title || 'No Title';
            const category = formatText(issue.category);
            const location = truncate(issue.location || '', 20);
            const reporter = issue.reporter_name || 'Anonymous';
            const date = new Date(issue.createdAt || issue.created_at).toLocaleDateString();
            const status = issue.status || 'Open';
            const id = issue.id || issue._id;

            // Determine Status Color
            const statusClass = status.toLowerCase().replace(' ', '_'); 
            
            tr.innerHTML = `
                <td><strong>${title}</strong></td>
                <td>${category}</td>
                <td>${location}</td>
                <td>${reporter}</td>
                <td>${date}</td>
                <td>
                    <select 
                        class="status-select ${statusClass}" 
                        onchange="updateStatus('${id}', this)"
                        data-prev="${status}"
                    >
                        <option value="Open" ${status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewDetails('${id}')" class="btn-small" style="cursor:pointer; padding:5px 10px; font-size:0.8rem; background:#e2e8f0; color:#334155; border:none; border-radius:4px;">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // 4. Show Table, Hide Loader
        loader.style.display = 'none';
        table.style.display = 'table';

    } catch (error) {
        console.error("Load Error:", error);
        loader.innerHTML = `<p style="color:red">Error loading data: ${error.message}</p>`;
        // Keep loader visible but show error message
    }
}

async function updateStatus(id, selectElement) {
    const newStatus = selectElement.value;
    const previousValue = selectElement.getAttribute('data-prev') || 'Open';
    
    // Optimistic UI update (change color immediately)
    selectElement.className = `status-select ${newStatus.toLowerCase().replace(' ', '_')}`;

    try {
        const response = await fetch(`/api/issues/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Update failed');

        // Success Toast
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Status Updated' });
        
        // Update previous value data attribute
        selectElement.setAttribute('data-prev', newStatus);

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Failed to update status', 'error');
        // Revert to old value on failure
        selectElement.value = previousValue;
        selectElement.className = `status-select ${previousValue.toLowerCase().replace(' ', '_')}`;
    }
}

// Helpers
function formatText(str) {
    return (str || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function truncate(str, n) {
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
}

async function viewDetails(id) {
    try {
        const response = await fetch(`/api/issues/${id}`);
        const issue = await response.json();
        
        if(issue.error) throw new Error(issue.error);

        Swal.fire({
            title: issue.title,
            html: `
                <div style="text-align:left">
                    <p><strong>Description:</strong> ${issue.description}</p>
                    <p><strong>Location:</strong> ${issue.location}</p>
                    <p><strong>Reporter:</strong> ${issue.reporter_name} (${issue.reporter_email})</p>
                    <p><strong>Phone:</strong> ${issue.reporter_phone || 'N/A'}</p>
                    ${issue.photo_path ? `<img src="${issue.photo_path}" style="width:100%; border-radius:5px; margin-top:10px">` : ''}
                </div>
            `,
            confirmButtonText: 'Close'
        });
    } catch(e) {
        Swal.fire('Error', 'Could not fetch details', 'error');
    }
}