// API Base URL - sesuaikan dengan backend Anda
const API_BASE_URL = 'http://localhost:5000/api/auth';

let modalTimeout;
let countdownInterval;

// Validation state
const validationState = {
    email: false
};

// Real-time email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email) && email.length <= 254;
    
    if (!email) {
        return { status: 'neutral', message: 'Masukkan alamat email yang terdaftar' };
    } else if (!isValid) {
        return { status: 'error', message: 'Format email tidak valid!' };
    } else {
        return { status: 'success', message: 'Email valid ✓' };
    }
}

// Update field validation UI
function updateFieldValidation(fieldId, validation) {
    const input = document.getElementById(fieldId);
    const indicator = document.getElementById(`${fieldId.replace('forgot', '').toLowerCase()}Indicator`);
    const message = document.getElementById(`${fieldId.replace('forgot', '').toLowerCase()}Message`);

    // Update input border
    input.className = input.className.replace(/input-\w+/, `input-${validation.status}`);
    
    // Update indicator
    indicator.className = `validation-indicator indicator-${validation.status}`;
    
    // Update message
    message.textContent = validation.message;
    message.className = `validation-message message-${validation.status === 'neutral' ? 'info' : validation.status}`;

    // Update validation state
    const field = fieldId.replace('forgot', '').toLowerCase();
    validationState[field] = validation.status === 'success';

    updateSubmitButton();
}

// Update submit button state
function updateSubmitButton() {
    const submitBtn = document.getElementById('forgotBtn');
    const allValid = Object.values(validationState).every(valid => valid);
    
    submitBtn.disabled = !allValid;
    if (allValid) {
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Modal functions with improved animations
function showModal(type, title, message, autoRedirect = false, redirectUrl = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButton = document.getElementById('modalButton');
    const modalIcon = document.getElementById('modalIcon');
    const countdownText = document.getElementById('countdownText');
    const countdownElement = document.getElementById('countdown');

    // Reset animations
    modal.querySelector('.modal-content').classList.remove('success-animation', 'error-animation');
    
    if (type === 'success') {
        modalTitle.textContent = 'Berhasil!';
        modalTitle.className = 'text-2xl font-bold mb-4 text-green-600';
        modalButton.className = 'bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all font-medium transform hover:scale-105';
        modalIcon.className = 'success-icon';
        modalIcon.innerHTML = '<i class="fas fa-check"></i>';
        modal.querySelector('.modal-content').classList.add('success-animation');
    } else {
        modalTitle.textContent = 'Oops!';
        modalTitle.className = 'text-2xl font-bold mb-4 text-red-600';
        modalButton.className = 'bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-full hover:from-red-600 hover:to-red-700 transition-all font-medium transform hover:scale-105';
        modalIcon.className = 'error-icon';
        modalIcon.innerHTML = '<i class="fas fa-times"></i>';
        modal.querySelector('.modal-content').classList.add('error-animation');
    }

    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    countdownText.classList.remove('hidden');

    // Start countdown
    let seconds = 5;
    countdownElement.textContent = seconds;

    countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            closeModal();
            
            if (type === 'success' && autoRedirect && redirectUrl) {
                window.location.href = redirectUrl;
            }
        }
    }, 1000);

    modalTimeout = setTimeout(() => {
        closeModal();
        if (type === 'success' && autoRedirect && redirectUrl) {
            window.location.href = redirectUrl;
        }
    }, 5000);
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('countdownText').classList.add('hidden');
    
    if (modalTimeout) {
        clearTimeout(modalTimeout);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
}

// Loading button state
function setButtonLoading(loading) {
    const forgotBtn = document.getElementById('forgotBtn');
    const forgotBtnText = document.getElementById('forgotBtnText');
    
    if (loading) {
        forgotBtn.disabled = true;
        forgotBtn.classList.add('btn-loading');
        forgotBtnText.style.opacity = '0';
    } else {
        forgotBtn.disabled = false;
        forgotBtn.classList.remove('btn-loading');
        forgotBtnText.style.opacity = '1';
    }
}

// Basic validation functions
function hasBasicValidation(email) {
    return email.trim() !== '';
}

// Clear error messages
function clearErrors() {
    document.querySelectorAll('.text-red-500').forEach(el => {
        if (el.id.includes('Error')) {
            el.classList.add('hidden');
            el.textContent = '';
        }
    });
}

// Show specific field error
function showFieldError(field, message) {
    const errorElement = document.getElementById(`${field}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Parse backend error messages
function handleBackendErrors(message) {
    clearErrors();
    
    const errorMappings = [
        { keywords: ['email'], field: 'email' }
    ];

    let errorShown = false;
    const lowerMessage = message.toLowerCase();

    for (const mapping of errorMappings) {
        if (mapping.keywords.some(keyword => lowerMessage.includes(keyword))) {
            showFieldError(mapping.field, message);
            errorShown = true;
            break;
        }
    }

    if (!errorShown) {
        showModal('error', 'Reset Password Gagal!', message, false);
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add real-time validation event listeners
    document.getElementById('forgotEmail').addEventListener('input', (e) => {
        const validation = validateEmail(e.target.value.trim());
        updateFieldValidation('forgotEmail', validation);
    });

    // Forgot password form submission
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('forgotEmail').value.trim();

        if (!hasBasicValidation(email)) {
            showModal('error', 'Form Tidak Lengkap', 'Email harus diisi!', false);
            return;
        }

        // Show loading with smooth animation
        setButtonLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            // Add a small delay to show the loading animation
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (response.ok) {
                showModal('success', 'Email Terkirim!', data.message, true, '/login');
                document.getElementById('forgotForm').reset();
                // Reset validation state
                validationState.email = false;
                updateSubmitButton();
                // Reset field appearance
                const emailInput = document.getElementById('forgotEmail');
                const emailIndicator = document.getElementById('emailIndicator');
                const emailMessage = document.getElementById('emailMessage');
                emailInput.className = emailInput.className.replace(/input-\w+/, 'input-neutral');
                emailIndicator.className = 'validation-indicator indicator-neutral';
                emailMessage.textContent = 'Masukkan alamat email yang terdaftar';
                emailMessage.className = 'validation-message message-info';
            } else {
                if (response.status === 429) {
                    showModal('error', 'Terlalu Banyak Percobaan', data.message, false);
                } else {
                    handleBackendErrors(data.message);
                }
            }
        } catch (error) {
            console.error('Connection error:', error);
            showModal('error', 'Koneksi Bermasalah', 'Terjadi kesalahan koneksi. Pastikan server backend berjalan dan coba lagi.', false);
        } finally {
            setButtonLoading(false);
        }
    });

    // Close modal when clicking outside
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });

    // Initialize submit button state
    updateSubmitButton();
});