        // Enhanced typing effect
        const texts = [
            "Welcome to SENA! ",
            "Security Engineering Network Assistant"
        ];
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;
        
        function typeText() {
            const currentText = texts[textIndex];
            const typingElement = document.getElementById('typing-text');
            
            if (isDeleting) {
                typingElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                typingElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }
            
            if (!isDeleting && charIndex === currentText.length) {
                setTimeout(() => {
                    isDeleting = true;
                }, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
            }
            
            setTimeout(typeText, typingSpeed);
        }
        
        // FIXED: Setup navigation buttons for Flask routes
        function setupNavigationButtons() {
            const loginBtn = document.getElementById('loginBtn');
            const registerBtn = document.getElementById('registerBtn');
            
            // Login button click handler - menggunakan Flask route
            loginBtn.addEventListener('click', () => {
                window.location.href = '/login';  // Flask route, bukan login.html
            });
            
            // Register button click handler - menggunakan Flask route
            registerBtn.addEventListener('click', () => {
                window.location.href = '/register';  // Flask route, bukan register.html
            });
        }
        
        // Start typing effect when page loads
        document.addEventListener('DOMContentLoaded', () => {
            typeText();
            
            // Initialize animations
            initializeAnimations();
            
            // Start counter animations for statistics
            animateCounters();
            
            // Setup navigation buttons
            setupNavigationButtons();
        });
        
        // Enhanced smooth scrolling
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
        
        // Enhanced scroll animations
        function initializeAnimations() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Element is entering viewport
                        entry.target.classList.add('animate');
                        entry.target.classList.remove('fade-out');
                        
                        // For staggered animations, add delay based on class
                        const staggerClass = Array.from(entry.target.classList).find(cls => cls.startsWith('stagger-'));
                        if (staggerClass) {
                            const delay = parseInt(staggerClass.split('-')[1]) * 100;
                            setTimeout(() => {
                                entry.target.classList.add('animate');
                                entry.target.classList.remove('fade-out');
                            }, delay);
                        }
                    } else {
                        // Element is leaving viewport (scrolling up)
                        const rect = entry.boundingClientRect;
                        const isScrollingUp = rect.bottom < 0;
                        
                        if (isScrollingUp) {
                            entry.target.classList.remove('animate');
                            entry.target.classList.add('fade-out');
                        }
                    }
                });
            }, observerOptions);
            
            // Observe all animation elements
            document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .fade-in').forEach(el => {
                observer.observe(el);
            });
        }
        
        // Counter animation for statistics
        function animateCounters() {
            const counters = document.querySelectorAll('.counter');
            
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const counter = entry.target;
                        const target = parseFloat(counter.getAttribute('data-target'));
                        const duration = 2000; // 2 seconds
                        const increment = target / (duration / 16); // 60fps
                        
                        let current = 0;
                        const updateCounter = () => {
                            current += increment;
                            if (current < target) {
                                if (target > 1000000) {
                                    counter.textContent = (current / 1000000).toFixed(1) + 'M+';
                                } else {
                                    counter.textContent = Math.floor(current).toFixed(1);
                                }
                                requestAnimationFrame(updateCounter);
                            } else {
                                if (target > 1000000) {
                                    counter.textContent = (target / 1000000).toFixed(0) + 'M+';
                                } else {
                                    counter.textContent = target.toString();
                                }
                            }
                        };
                        
                        updateCounter();
                        counterObserver.unobserve(counter);
                    }
                });
            }, { threshold: 0.7 });
            
            counters.forEach(counter => {
                counterObserver.observe(counter);
            });
        }
        
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
        
        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            const hero = document.getElementById('home');
            if (hero) {
                hero.style.transform = `translateY(${rate}px)`;
            }
        });