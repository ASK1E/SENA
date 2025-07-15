// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/auth';

// Global variables
let modalTimeout;
let countdownInterval;
let usernameCheckTimeout;

// Validation state
const validationState = {
    email: false,
    username: false,
    password: false
};

// DOM Elements Cache
const elements = {
    registerForm: null,
    registerEmail: null,
    registerUsername: null,
    registerPassword: null,
    registerBtn: null,
    registerBtnText: null,
    modal: null,
    modalTitle: null,
    modalMessage: null,
    modalButton: null,
    modalIcon: null,
    countdownText: null,
    countdownElement: null,
    emailIndicator: null,
    usernameIndicator: null,
    passwordIndicator: null,
    emailMessage: null,
    usernameMessage: null,
    passwordMessage: null,
    strengthBar: null,
    usernameAvailability: null
};

// Initialize DOM elements
function initializeElements() {
    elements.registerForm = document.getElementById('registerForm');
    elements.registerEmail = document.getElementById('registerEmail');
    elements.registerUsername = document.getElementById('registerUsername');
    elements.registerPassword = document.getElementById('registerPassword');
    elements.registerBtn = document.getElementById('registerBtn');
    elements.registerBtnText = document.getElementById('registerBtnText');
    elements.modal = document.getElementById('modal');
    elements.modalTitle = document.getElementById('modalTitle');
    elements.modalMessage = document.getElementById('modalMessage');
    elements.modalButton = document.getElementById('modalButton');
    elements.modalIcon = document.getElementById('modalIcon');
    elements.countdownText = document.getElementById('countdownText');
    elements.countdownElement = document.getElementById('countdown');
    elements.emailIndicator = document.getElementById('emailIndicator');
    elements.usernameIndicator = document.getElementById('usernameIndicator');
    elements.passwordIndicator = document.getElementById('passwordIndicator');
    elements.emailMessage = document.getElementById('emailMessage');
    elements.usernameMessage = document.getElementById('usernameMessage');
    elements.passwordMessage = document.getElementById('passwordMessage');
    elements.strengthBar = document.getElementById('strengthBar');
    elements.usernameAvailability = document.getElementById('usernameAvailability');
}

// Validation Functions
class Validator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email) && email.length <= 254;
        
        if (!email) {
            return { status: 'neutral', message: 'Masukkan alamat email yang valid' };
        } else if (!isValid) {
            return { status: 'error', message: 'Format email tidak valid!' };
        } else {
            return { status: 'success', message: 'Email valid ✓' };
        }
    }

    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        const blockedPatterns = ['admin', 'root', 'null', 'undefined'];
        
        if (!username) {
            return { status: 'neutral', message: '3-25 karakter, hanya huruf, angka, dan underscore' };
        } else if (username.length < 3 || username.length > 25) {
            return { status: 'error', message: 'Username harus 3-25 karakter!' };
        } else if (blockedPatterns.includes(username.toLowerCase())) {
            return { status: 'error', message: 'Username diblokir! Gunakan yang lain!' };
        } else if (!usernameRegex.test(username)) {
            return { status: 'error', message: 'Hanya huruf, angka, dan underscore!' };
        } else {
            return { status: 'success', message: 'Username valid ✓' };
        }
    }

    static validatePassword(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            digit: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        let strength = 'weak';
        let status = 'error';
        let message = '';

        if (!password) {
            return { 
                status: 'neutral', 
                message: 'Minimal 8 karakter dengan huruf besar, kecil, angka, dan karakter khusus',
                strength: null 
            };
        }

        if (passedChecks <= 2) {
            strength = 'weak';
            status = 'error';
            message = 'Password terlalu lemah';
        } else if (passedChecks === 3) {
            strength = 'fair';
            status = 'warning';
            message = 'Password cukup, tambahkan kompleksitas';
        } else if (passedChecks === 4) {
            strength = 'good';
            status = 'warning';
            message = 'Password bagus, hampir sempurna';
        } else {
            strength = 'strong';
            status = 'success';
            message = 'Password sangat kuat ✓';
        }

        return { status, message, strength };
    }
}

// UI Update Functions
class UIUpdater {
    static updateFieldValidation(fieldId, validation) {
        const input = document.getElementById(fieldId);
        const fieldName = fieldId.replace('register', '').toLowerCase();
        const indicator = elements[`${fieldName}Indicator`];
        const message = elements[`${fieldName}Message`];

        // Update input border
        input.className = input.className.replace(/input-\w+/, `input-${validation.status}`);
        
        // Update indicator
        indicator.className = `validation-indicator indicator-${validation.status}`;
        
        // Update message
        message.textContent = validation.message;
        message.className = `validation-message message-${validation.status === 'neutral' ? 'info' : validation.status}`;

        // Update validation state
        validationState[fieldName] = validation.status === 'success';

        // Update password strength meter
        if (fieldId === 'registerPassword' && validation.strength) {
            elements.strengthBar.className = `strength-bar strength-${validation.strength}`;
        }

        this.updateSubmitButton();
    }

    static updateSubmitButton() {
        const allValid = Object.values(validationState).every(valid => valid);
        
        elements.registerBtn.disabled = !allValid;
        if (allValid) {
            elements.registerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            elements.registerBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    static setButtonLoading(loading) {
        if (loading) {
            elements.registerBtn.disabled = true;
            elements.registerBtn.classList.add('btn-loading');
            elements.registerBtnText.style.opacity = '0';
        } else {
            elements.registerBtn.disabled = false;
            elements.registerBtn.classList.remove('btn-loading');
            elements.registerBtnText.style.opacity = '1';
        }
    }
}

// Username Availability Checker
class UsernameChecker {
    static async checkAvailability(username) {
        if (!username || username.length < 3) return;

        elements.usernameAvailability.classList.add('show');

        // Simulate API call delay
        setTimeout(() => {
            elements.usernameAvailability.classList.remove('show');
            // In real implementation, you would make an API call here
        }, 1000);
    }
}

// Modal Manager
class ModalManager {
    static show(type, title, message, autoRedirect = false) {
        // Reset animations
        elements.modal.querySelector('.modal-content').classList.remove('success-animation', 'error-animation');
        
        if (type === 'success') {
            elements.modalTitle.textContent = 'Berhasil!';
            elements.modalTitle.className = 'text-2xl font-bold mb-4 text-green-600';
            elements.modalButton.className = 'bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all font-medium transform hover:scale-105';
            elements.modalIcon.className = 'success-icon';
            elements.modalIcon.innerHTML = '<i class="fas fa-check"></i>';
            elements.modal.querySelector('.modal-content').classList.add('success-animation');
        } else {
            elements.modalTitle.textContent = 'Oops!';
            elements.modalTitle.className = 'text-2xl font-bold mb-4 text-red-600';
            elements.modalButton.className = 'bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-full hover:from-red-600 hover:to-red-700 transition-all font-medium transform hover:scale-105';
            elements.modalIcon.className = 'error-icon';
            elements.modalIcon.innerHTML = '<i class="fas fa-times"></i>';
            elements.modal.querySelector('.modal-content').classList.add('error-animation');
        }

        elements.modalMessage.textContent = message;
        elements.modal.classList.remove('hidden');
        elements.countdownText.classList.remove('hidden');

        this.startCountdown(type, autoRedirect);
    }

    static startCountdown(type, autoRedirect) {
        let seconds = 5;
        elements.countdownElement.textContent = seconds;

        countdownInterval = setInterval(() => {
            seconds--;
            elements.countdownElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                this.close();
                
                if (type === 'success' && autoRedirect) {
                    window.location.href = '/verify';
                }
            }
        }, 1000);

        modalTimeout = setTimeout(() => {
            this.close();
            if (type === 'success' && autoRedirect) {
                window.location.href = '/verify';
            }
        }, 5000);
    }

    static close() {
        elements.modal.classList.add('hidden');
        elements.countdownText.classList.add('hidden');
        
        if (modalTimeout) {
            clearTimeout(modalTimeout);
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    }
}

// Error Handler
class ErrorHandler {
    static clearErrors() {
        document.querySelectorAll('.text-red-500').forEach(el => {
            if (el.id.includes('Error')) {
                el.classList.add('hidden');
                el.textContent = '';
            }
        });
    }

    static showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    static handleBackendErrors(message) {
        this.clearErrors();
        
        const errorMappings = [
            { keywords: ['email'], field: 'email' },
            { keywords: ['username'], field: 'username' },
            { keywords: ['password'], field: 'password' }
        ];

        let errorShown = false;
        const lowerMessage = message.toLowerCase();

        for (const mapping of errorMappings) {
            if (mapping.keywords.some(keyword => lowerMessage.includes(keyword))) {
                this.showFieldError(mapping.field, message);
                errorShown = true;
                break;
            }
        }

        if (!errorShown) {
            ModalManager.show('error', 'Registrasi Gagal!', message, false);
        }
    }
}

// API Service
class ApiService {
    static async register(email, username, password) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, username, password })
        });

        const data = await response.json();
        return { response, data };
    }
}

// Form Validator
class FormValidator {
    static hasBasicValidation(email, username, password) {
        return email.trim() !== '' && username.trim() !== '' && password.trim() !== '';
    }
}

// Password Toggle Utility
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

// Event Handlers
class EventHandlers {
    static setupValidationEvents() {
        elements.registerEmail.addEventListener('input', (e) => {
            const validation = Validator.validateEmail(e.target.value.trim());
            UIUpdater.updateFieldValidation('registerEmail', validation);
        });

        elements.registerUsername.addEventListener('input', (e) => {
            const validation = Validator.validateUsername(e.target.value.trim());
            UIUpdater.updateFieldValidation('registerUsername', validation);
            
            // Check availability with debounce
            clearTimeout(usernameCheckTimeout);
            if (validation.status === 'success') {
                usernameCheckTimeout = setTimeout(() => {
                    UsernameChecker.checkAvailability(e.target.value.trim());
                }, 500);
            }
        });

        elements.registerPassword.addEventListener('input', (e) => {
            const validation = Validator.validatePassword(e.target.value);
            UIUpdater.updateFieldValidation('registerPassword', validation);
        });
    }

    static setupFormSubmission() {
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            ErrorHandler.clearErrors();

            const email = elements.registerEmail.value.trim();
            const username = elements.registerUsername.value.trim();
            const password = elements.registerPassword.value;

            if (!FormValidator.hasBasicValidation(email, username, password)) {
                ModalManager.show('error', 'Form Tidak Lengkap', 'Semua field harus diisi!', false);
                return;
            }

            // Show loading with smooth animation
            UIUpdater.setButtonLoading(true);

            try {
                const { response, data } = await ApiService.register(email, username, password);

                // Add a small delay to show the loading animation
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (response.ok) {
                    ModalManager.show('success', 'Registrasi Berhasil!', data.message, true);
                    elements.registerForm.reset();
                } else {
                    if (response.status === 429) {
                        ModalManager.show('error', 'Terlalu Banyak Percobaan', data.message, false);
                    } else {
                        ErrorHandler.handleBackendErrors(data.message);
                    }
                }
            } catch (error) {
                console.error('Connection error:', error);
                ModalManager.show('error', 'Koneksi Bermasalah', 'Terjadi kesalahan koneksi. Pastikan server backend berjalan dan coba lagi.', false);
            } finally {
                UIUpdater.setButtonLoading(false);
            }
        });
    }

    static setupModalEvents() {
        // Close modal when clicking outside
        elements.modal.addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                ModalManager.close();
            }
        });

        // Close modal button
        elements.modalButton.addEventListener('click', () => {
            ModalManager.close();
        });
    }
}

// Main Application Initializer
class RegisterApp {
    static init() {
        // Initialize DOM elements
        initializeElements();

        // Setup event handlers
        EventHandlers.setupValidationEvents();
        EventHandlers.setupFormSubmission();
        EventHandlers.setupModalEvents();

        // Initial UI state
        UIUpdater.updateSubmitButton();

        console.log('Register App initialized successfully!');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    RegisterApp.init();
});

// Export for global access (if needed)
window.RegisterApp = RegisterApp;
window.togglePassword = togglePassword;