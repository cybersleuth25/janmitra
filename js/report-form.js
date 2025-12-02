// Report Issue Form JavaScript

let currentStep = 1;
const totalSteps = 3;

document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    initializeFileUpload();
    prePopulateFromURL();
});

// Initialize form functionality
function initializeForm() {
    // Form submission handler
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleFormSubmit);
    }

    // Real-time validation
    setupRealTimeValidation();

    // Update progress bar
    updateProgressBar();
}

// Setup real-time form validation
function setupRealTimeValidation() {
    // Name validation
    const nameField = document.getElementById('name');
    if (nameField) {
        nameField.addEventListener('blur', function() {
            validateName();
        });
        nameField.addEventListener('input', function() {
            clearError('name');
        });
    }

    // Email validation
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            validateEmailField();
        });
        emailField.addEventListener('input', function() {
            clearError('email');
        });
    }

    // Phone validation
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('blur', function() {
            validatePhoneField();
        });
        phoneField.addEventListener('input', function() {
            clearError('phone');
        });
    }

    // Address validation
    const addressField = document.getElementById('address');
    if (addressField) {
        addressField.addEventListener('blur', function() {
            validateAddress();
        });
        addressField.addEventListener('input', function() {
            clearError('address');
        });
    }

    // Issue type validation
    const issueTypeField = document.getElementById('issueType');
    if (issueTypeField) {
        issueTypeField.addEventListener('change', function() {
            validateIssueType();
        });
    }

    // Description validation
    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        descriptionField.addEventListener('blur', function() {
            validateDescription();
        });
        descriptionField.addEventListener('input', function() {
            clearError('description');
        });
    }
}

// Pre-populate form from URL parameters
function prePopulateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category && document.getElementById('issueType')) {
        document.getElementById('issueType').value = category;
    }
}

// Step navigation functions
window.nextStep = function() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
            updateProgressBar();
            
            // Update review section when reaching step 3
            if (currentStep === 3) {
                updateReviewSection();
            }
        }
    }
};

window.prevStep = function() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgressBar();
    }
};

// Show specific step
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach((stepElement, index) => {
        stepElement.classList.toggle('active', index + 1 === step);
    });
    
    // Scroll to top of form
    document.querySelector('.form-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Update progress bar
function updateProgressBar() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentStep);
    });
}

// Validate current step
function validateCurrentStep() {
    clearAllErrors();
    let isValid = true;

    switch (currentStep) {
        case 1:
            isValid = validateStep1();
            break;
        case 2:
            isValid = validateStep2();
            break;
        case 3:
            isValid = validateStep3();
            break;
    }

    return isValid;
}

// Validate step 1 (Personal Information)
function validateStep1() {
    let isValid = true;

    if (!validateName()) isValid = false;
    if (!validateEmailField()) isValid = false;
    
    // Phone is optional, but validate if provided
    const phone = document.getElementById('phone').value.trim();
    if (phone && !validatePhoneField()) isValid = false;

    return isValid;
}

// Validate step 2 (Issue Details)
function validateStep2() {
    let isValid = true;

    if (!validateAddress()) isValid = false;
    if (!validateIssueType()) isValid = false;
    if (!validateDescription()) isValid = false;

    return isValid;
}

// Validate step 3 (Review & Agreement)
function validateStep3() {
    const agreeCheckbox = document.getElementById('agree');
    if (!agreeCheckbox.checked) {
        showError('agree', 'You must agree to the terms to submit your report.');
        return false;
    }
    return true;
}

// Individual field validation functions
function validateName() {
    const name = document.getElementById('name').value.trim();
    if (!name) {
        showError('name', 'Full name is required.');
        return false;
    }
    if (name.length < 2) {
        showError('name', 'Name must be at least 2 characters long.');
        return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        showError('name', 'Name can only contain letters, spaces, apostrophes, and hyphens.');
        return false;
    }
    clearError('name');
    return true;
}

function validateEmailField() {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        showError('email', 'Email address is required.');
        return false;
    }
    if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email address.');
        return false;
    }
    clearError('email');
    return true;
}

function validatePhoneField() {
    const phone = document.getElementById('phone').value.trim();
    if (phone && !validatePhone(phone)) {
        showError('phone', 'Please enter a valid phone number.');
        return false;
    }
    clearError('phone');
    return true;
}

function validateAddress() {
    const address = document.getElementById('address').value.trim();
    if (!address) {
        showError('address', 'Location/Address is required.');
        return false;
    }
    if (address.length < 10) {
        showError('address', 'Please provide a more detailed location description.');
        return false;
    }
    clearError('address');
    return true;
}

function validateIssueType() {
    const issueType = document.getElementById('issueType').value;
    if (!issueType) {
        showError('issueType', 'Please select an issue category.');
        return false;
    }
    clearError('issueType');
    return true;
}

function validateDescription() {
    const description = document.getElementById('description').value.trim();
    if (!description) {
        showError('description', 'Issue description is required.');
        return false;
    }
    if (description.length < 20) {
        showError('description', 'Please provide a more detailed description (at least 20 characters).');
        return false;
    }
    if (description.length > 1000) {
        showError('description', 'Description is too long (maximum 1000 characters).');
        return false;
    }
    clearError('description');
    return true;
}

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('photo');
    const uploadArea = document.getElementById('fileUploadArea');

    if (fileInput && uploadArea) {
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#3498db';
            uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#cbd3da';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#cbd3da';
            uploadArea.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (validateFile(file)) {
                    fileInput.files = files;
                    previewImage({ target: { files: [file] } });
                }
            }
        });
    }
}

// Image preview function
window.previewImage = function(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreview');
    
    if (!file) {
        previewContainer.innerHTML = '';
        return;
    }

    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <button type="button" onclick="removeImage()" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
};

// Remove uploaded image
window.removeImage = function() {
    document.getElementById('photo').value = '';
    document.getElementById('imagePreview').innerHTML = '';
};

// Validate file
function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPG, PNG, or GIF).', 'error');
        return false;
    }

    if (file.size > maxSize) {
        showToast('File size must be less than 5MB.', 'error');
        return false;
    }

    return true;
}

// Update review section
function updateReviewSection() {
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        issueType: document.getElementById('issueType').value,
        description: document.getElementById('description').value.trim()
    };

    // Update review fields
    document.getElementById('reviewName').textContent = formData.name;
    document.getElementById('reviewEmail').textContent = formData.email;
    document.getElementById('reviewPhone').textContent = formData.phone || 'Not provided';
    document.getElementById('reviewAddress').textContent = formData.address;
    
    // Format issue type
    const issueTypeText = document.getElementById('issueType').selectedOptions[0]?.text || 'Not selected';
    document.getElementById('reviewIssueType').textContent = issueTypeText.replace(/^[🛣️💡💧🗑️🚌🚶🚦🔊🌳❗]\s*/, '');
    
    document.getElementById('reviewDescription').textContent = formData.description;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }

    const form = event.target;
    const formData = new FormData(form);

    try {
        // Create proper title from selected option and description
        const selectedOption = document.getElementById('issueType').selectedOptions[0];
        const categoryText = selectedOption?.text.replace(/^[🛣️💡💧🗑️🚌🚶🚦🔊🌳❗]\s*/, '') || 'Issue';
        const descriptionStart = document.getElementById('description').value.substring(0, 50).trim();
        const title = `${categoryText}: ${descriptionStart}${descriptionStart.length === 50 ? '...' : ''}`;
        
        // Prepare form data for submission
        formData.append('title', title);
        formData.append('category', formData.get('issue_type'));
        formData.delete('issue_type'); // Remove old field name

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // Submit to PHP backend
        const response = await fetch('includes/submit_issue.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;

        if (result.success) {
            // Show success
            showSuccessModal(result.data.reference_id);
            
            // Clear form
            form.reset();
            currentStep = 1;
            showStep(1);
            updateProgressBar();
            removeImage();
            
            // Clear any saved draft
            LocalStorage.remove('issueReport_draft');
        } else {
            // Show error
            if (result.data && result.data.errors) {
                result.data.errors.forEach(error => showToast(error, 'error'));
            } else {
                showToast(result.message || 'Failed to submit issue. Please try again.', 'error');
            }
        }

    } catch (error) {
        console.error('Form submission error:', error);
        showToast('Network error occurred. Please check your connection and try again.', 'error');
        
        // Reset button on error
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            const originalText = submitButton.dataset.originalText || 'Submit Report';
            submitButton.innerHTML = originalText;
        }
    }
}

// Show success modal
function showSuccessModal(referenceId) {
    document.getElementById('referenceId').textContent = `REP-${referenceId}`;
    document.getElementById('successModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close success modal
window.closeModal = function() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
};

// Auto-save form data to localStorage
function autoSaveFormData() {
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        issueType: document.getElementById('issueType').value,
        description: document.getElementById('description').value
    };

    LocalStorage.set('issueReport_draft', formData);
}

// Restore form data from localStorage
function restoreFormData() {
    const savedData = LocalStorage.get('issueReport_draft');
    
    if (savedData) {
        Object.entries(savedData).forEach(([key, value]) => {
            const field = document.getElementById(key);
            if (field && value) {
                field.value = value;
            }
        });

        // Show restore notification
        const restoreBtn = document.createElement('button');
        restoreBtn.type = 'button';
        restoreBtn.className = 'btn btn-secondary btn-small';
        restoreBtn.innerHTML = '<i class="fas fa-undo"></i> Restore Draft';
        restoreBtn.onclick = function() {
            restoreFormData();
            this.style.display = 'none';
            showToast('Draft restored successfully!', 'success');
        };

        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.appendChild(restoreBtn);
        }
    }
}

// Auto-save every 30 seconds
setInterval(autoSaveFormData, 30000);

// Save on page unload
window.addEventListener('beforeunload', function() {
    autoSaveFormData();
});

// Character counter for description
document.addEventListener('DOMContentLoaded', function() {
    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        const maxLength = 1000;
        
        // Create counter element
        const counter = document.createElement('div');
        counter.style.cssText = 'text-align: right; font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem;';
        counter.id = 'descriptionCounter';
        
        descriptionField.parentNode.appendChild(counter);
        
        // Update counter
        function updateCounter() {
            const remaining = maxLength - descriptionField.value.length;
            counter.textContent = `${remaining} characters remaining`;
            counter.style.color = remaining < 100 ? '#e74c3c' : '#6c757d';
        }
        
        descriptionField.addEventListener('input', updateCounter);
        updateCounter();
    }
});

console.log('Report Form JS Loaded Successfully');