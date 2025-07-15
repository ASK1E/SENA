// API Base URL - sesuaikan dengan backend Anda
const API_BASE_URL = 'http://localhost:5000/api/auth';

let modalTimeout;
let countdownInterval;

// Validation state
const validationState = {
    email: false,
    password: false
};

// Real-time validation functions
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

function validatePassword(password) {
    if (!password) {
        return { status: 'neutral', message: 'Masukkan password akun Anda' };
    } else if (password.length < 1) {
        return { status: 'error', message: 'Password tidak boleh kosong!' };
    } else {
        return { status: 'success', message: 'Password siap ✓' };
    }
}

// Update field validation UI
function updateFieldValidation(fieldId, validation) {
    const input = document.getElementById(fieldId);
    const indicator = document.getElementById(`${fieldId.replace('login', '').toLowerCase()}Indicator`);
    const message = document.getElementById(`${fieldId.replace('login', '').toLowerCase()}Message`);

    input.className = input.className.replace(/input-\w+/, `input-${validation.status}`);
    indicator.className = `validation-indicator indicator-${validation.status}`;
    message.textContent = validation.message;
    message.className = `validation-message message-${validation.status === 'neutral' ? 'info' : validation.status}`;

    const field = fieldId.replace('login', '').toLowerCase();
    validationState[field] = validation.status === 'success';
    updateSubmitButton();
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('loginBtn');
    const allValid = Object.values(validationState).every(valid => valid);
    
    submitBtn.disabled = !allValid;
    if (allValid) {
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (emailInput) {
        emailInput.addEventListener('input', (e) => {
            const validation = validateEmail(e.target.value.trim());
            updateFieldValidation('loginEmail', validation);
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const validation = validatePassword(e.target.value);
            updateFieldValidation('loginPassword', validation);
        });
    }
});

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showModal(type, title, message, autoRedirect = false) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButton = document.getElementById('modalButton');
    const modalIcon = document.getElementById('modalIcon');
    const countdownText = document.getElementById('countdownText');
    const countdownElement = document.getElementById('countdown');

    modal.querySelector('.modal-content').classList.remove('success-animation', 'error-animation');
    
    if (type === 'success') {
        modalTitle.textContent = 'Login Berhasil!';
        modalTitle.className = 'text-2xl font-bold mb-4 text-green-600';
        modalButton.className = 'bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all font-medium transform hover:scale-105';
        modalIcon.className = 'success-icon';
        modalIcon.innerHTML = '<i class="fas fa-check"></i>';
        modal.querySelector('.modal-content').classList.add('success-animation');
    } else {
        modalTitle.textContent = 'Login Gagal!';
        modalTitle.className = 'text-2xl font-bold mb-4 text-red-600';
        modalButton.className = 'bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-full hover:from-red-600 hover:to-red-700 transition-all font-medium transform hover:scale-105';
        modalIcon.className = 'error-icon';
        modalIcon.innerHTML = '<i class="fas fa-times"></i>';
        modal.querySelector('.modal-content').classList.add('error-animation');
    }

    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    countdownText.classList.remove('hidden');

    let seconds = type === 'success' ? 3 : 5;
    countdownElement.textContent = seconds;

    countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            closeModal();
            if (type === 'success' && autoRedirect) {
                window.location.href = '/dashboard'; // ← DIUBAH
            }
        }
    }, 1000);

    modalTimeout = setTimeout(() => {
        closeModal();
        if (type === 'success' && autoRedirect) {
            window.location.href = '/dashboard'; // ← DIUBAH
        }
    }, (type === 'success' ? 3 : 5) * 1000);
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('countdownText').classList.add('hidden');
    if (modalTimeout) clearTimeout(modalTimeout);
    if (countdownInterval) clearInterval(countdownInterval);
}

function setButtonLoading(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    loginBtn.disabled = loading;
    loginBtn.classList.toggle('btn-loading', loading);
    loginBtn.classList.toggle('opacity-50', loading);
    loginBtn.classList.toggle('cursor-not-allowed', loading);
    loginBtnText.style.opacity = loading ? '0' : '1';
}

function hasBasicValidation(email, password) {
    return email.trim() !== '' && password.trim() !== '';
}

function saveUserData(userData) {
    const userInfo = {
        email: userData.email,
        username: userData.username,
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    sessionStorage.setItem('jwt_token', userData.jwt_token);
}

function clearUserData() {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('jwt_token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('jwt_token');
}

function checkAuthStatus() {
    const token = sessionStorage.getItem('jwt_token');
    const userInfo = sessionStorage.getItem('userInfo');
    return token && userInfo;
}

function handleApiError(response, data) {
    let errorMessage = 'Terjadi kesalahan yang tidak diketahui';
    if (data && data.message) errorMessage = data.message;
    else {
        switch (response.status) {
            case 400: errorMessage = 'Data yang dikirim tidak valid'; break;
            case 401: errorMessage = 'Email atau password salah'; break;
            case 403: errorMessage = 'Akses ditolak'; break;
            case 404: errorMessage = 'Endpoint tidak ditemukan'; break;
            case 429: errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi nanti'; break;
            case 500: errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti'; break;
            default: errorMessage = `Kesalahan HTTP ${response.status}`;
        }
    }
    return errorMessage;
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!hasBasicValidation(email, password)) {
        showModal('error', 'Login Gagal!', 'Silakan isi semua field yang diperlukan');
        return;
    }
    setButtonLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            saveUserData(data);
            showModal('success', 'Login Berhasil!', data.message || `Selamat datang ${data.username}!`, true);
        } else {
            const errorMessage = handleApiError(response, data);
            showModal('error', 'Login Gagal!', errorMessage);
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Tidak dapat terhubung ke server. Pastikan server berjalan di ' + API_BASE_URL;
        }
        showModal('error', 'Login Gagal!', errorMessage);
    } finally {
        setButtonLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    if (checkAuthStatus()) {
        window.location.href = '/dashboard'; // ← DIUBAH
        return;
    }
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (loginBtn) loginBtn.addEventListener('click', (e) => {
        if (!loginForm) handleLogin(e);
    });
    const formFields = document.querySelectorAll('#loginEmail, #loginPassword');
    formFields.forEach(field => {
        field.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!loginBtn.disabled) handleLogin(e);
            }
        });
    });
    clearUserData();
});

async function handleLogout() {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) {
        clearUserData();
        window.location.href = '/login';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        clearUserData();
        if (response.ok) {
            showModal('success', 'Logout Berhasil!', 'Anda telah berhasil logout', false);
            setTimeout(() => window.location.href = '/login', 2000);
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        clearUserData();
        window.location.href = '/login';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        handleLogout,
        checkAuthStatus,
        saveUserData,
        clearUserData
    };
}
