// Auto-select category from URL parameters when page loads
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        const select = document.getElementById('category');
        if (select) {
            // Map URL param to select value if needed, or use directly if they match
            // e.g. if your select option is "garbage" and param is "garbage"
            select.value = categoryParam;
        }
    }
});

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Submitting...';
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('reporter_name', document.getElementById('name').value || 'Anonymous');
    formData.append('reporter_email', document.getElementById('email').value || '');
    formData.append('reporter_phone', document.getElementById('phone').value || '');

    const fileInput = document.getElementById('photo');
    if (fileInput.files.length > 0) {
        formData.append('photo', fileInput.files[0]);
    }

    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            // MODERN POPUP using SweetAlert2
            Swal.fire({
                title: 'Success!',
                text: 'Your issue has been reported successfully.',
                icon: 'success',
                confirmButtonText: 'View Issues',
                confirmButtonColor: '#4f46e5',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'view-issues.html';
                }
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: result.error || 'Failed to submit issue.',
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Network Error',
            text: 'Cannot connect to the server. Is Node.js running?',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});