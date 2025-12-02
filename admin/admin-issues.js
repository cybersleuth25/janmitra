document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadIssues();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';
}

async function loadIssues() {
    try {
        const response = await fetch('/api/issues?limit=100&_=' + Date.now());
        const result = await response.json();

        if (!result.issues) throw new Error('Failed to load issues');

        const tbody = document.getElementById('issuesBody');
        tbody.innerHTML = ''; // Clear existing

        result.issues.forEach(issue => {
            const tr = document.createElement('tr');
            
            // Handle Status Color logic
            const status = (issue.status || 'Open');
            const statusClass = status.toLowerCase(); // open, in_progress, resolved
            
            tr.innerHTML = `
                <td><strong>${issue.title}</strong></td>
                <td>${formatText(issue.category)}</td>
                <td>${truncate(issue.location, 20)}</td>
                <td>${issue.reporter_name || 'Anon'}</td>
                <td>${new Date(issue.createdAt || issue.created_at).toLocaleDateString()}</td>
                <td>
                    <select 
                        class="status-select ${statusClass}" 
                        onchange="updateStatus('${issue.id || issue._id}', this)"
                    >
                        <option value="Open" ${status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewDetails('${issue.id || issue._id}')" class="btn-small" style="padding:5px 10px; font-size:0.8rem; background:#e2e8f0; color:#334155; border-radius:4px;">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('loading').style.display = 'none';
        document.getElementById('issuesTable').style.display = 'table';

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Could not load issues', 'error');
    }
}

async function updateStatus(id, selectElement) {
    const newStatus = selectElement.value;
    const previousValue = selectElement.getAttribute('data-prev') || 'Open';
    
    // Update the color of the dropdown immediately for feedback
    selectElement.className = `status-select ${newStatus.toLowerCase()}`;

    try {
        const response = await fetch(`/api/issues/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Add token if your backend requires it (optional for now based on your setup)
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: 'Status Updated successfully' });
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Failed to update status', 'error');
        // Revert selection if failed
        selectElement.value = previousValue; 
    }
}

function formatText(str) {
    return (str || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
}

// Simple view details for Admin
async function viewDetails(id) {
    const response = await fetch(`/api/issues/${id}`);
    const issue = await response.json();
    
    Swal.fire({
        title: issue.title,
        html: `
            <div style="text-align:left">
                <p><strong>Description:</strong> ${issue.description}</p>
                <p><strong>Location:</strong> ${issue.location}</p>
                <p><strong>Reporter:</strong> ${issue.reporter_name} (${issue.reporter_email})</p>
                <p><strong>Reporter Phone:</strong> ${issue.reporter_phone || 'N/A'}</p>
                ${issue.photo_path ? `<img src="${issue.photo_path}" style="width:100%; border-radius:5px; margin-top:10px">` : ''}
            </div>
        `,
        confirmButtonText: 'Close'
    });
}