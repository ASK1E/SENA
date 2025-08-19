// SENA Dashboard JavaScript
    // Main application state
    let scanHistory = [];
    let currentScan = null;
    let animationObserver = null;

    // Initialize application when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });

    // Main initialization function
    function initializeApp() {
        setupAnimations();
        setupSidebar();
        setupNavigation();
        setupTypingEffect();
        setupCounters();
        loadScanHistory();
        setupHistoryFilters();
        updateDashboardStats();
        
        console.log('🚀 SENA Dashboard initialized successfully!');
    }
    // =====================================
    // LOGOUT FUNCTIONALITY
    // =====================================

    function showLogoutConfirmation() {
        const modal = document.getElementById('logout-modal');
        const modalContent = document.getElementById('logout-modal-content');
        
        modal.classList.remove('hidden');
        
        // Animate modal in
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function hideLogoutConfirmation() {
        const modal = document.getElementById('logout-modal');
        const modalContent = document.getElementById('logout-modal-content');
        
        // Animate modal out
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    function confirmLogout() {
        const confirmBtn = document.getElementById('confirm-logout-btn');
        const originalText = confirmBtn.innerHTML;
        
        // Show loading state
        confirmBtn.innerHTML = '<span class="loader inline-block w-4 h-4 mr-2"></span>Logging out...';
        confirmBtn.disabled = true;
        
        // Simulate logout process
        setTimeout(() => {
            // Clear any stored data
            localStorage.clear();
            sessionStorage.clear();
            
            // Show success notification
            showNotification('Logout berhasil! Mengarahkan ke halaman utama...', 'success');
            
            // Redirect to index.html after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        }, 1000);
    }

    // =====================================
    // ANIMATION SYSTEM
    // =====================================

    function setupAnimations() {
        // Intersection Observer for scroll animations
        animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all animation elements
        const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .fade-in');
        animatedElements.forEach(el => animationObserver.observe(el));
    }

    // =====================================
    // SIDEBAR FUNCTIONALITY
    // =====================================

    function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const logoButton = document.getElementById('sidebar-logo');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainContent = document.getElementById('main-content');

    // Ganti toggle dari tombol ke logo
    logoButton?.addEventListener('click', function() {
        toggleSidebar();
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', function() {
        sidebar.classList.toggle('mobile-open');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        if (sidebar.classList.contains('sidebar-expanded')) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            mainContent.classList.remove('sidebar-expanded');
            mainContent.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.classList.add('sidebar-expanded');
        }
    }

    // =====================================
    // NAVIGATION SYSTEM
    // =====================================

    function setupNavigation() {
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Smooth scroll to target
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update active nav state
                    updateActiveNav(targetId);
                    
                    // Close mobile menu if open
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.remove('mobile-open');
                    }
                }
            });
        });

        // Update active nav on scroll
        window.addEventListener('scroll', debounce(updateActiveNavOnScroll, 100));
    }

    function updateActiveNav(activeId) {
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        navLinks.forEach(link => {
            link.classList.remove('bg-gray-700');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('bg-gray-700');
            }
        });
    }

    function updateActiveNavOnScroll() {
        const sections = ['home', 'scanning', 'history', 'about'];
        const scrollPos = window.scrollY + 100;
        
        for (let section of sections) {
            const element = document.getElementById(section);
            if (element) {
                const elementTop = element.offsetTop;
                const elementBottom = elementTop + element.offsetHeight;
                
                if (scrollPos >= elementTop && scrollPos < elementBottom) {
                    updateActiveNav(section);
                    break;
                }
            }
        }
    }

    // =====================================
    // TYPING EFFECT
    // =====================================

    function setupTypingEffect() {
        const typingElement = document.getElementById('typing-text');
        const messages = [
            'Welcome to SENA',
            'Scanning Engineering Network Assistant',
            'Advanced Security Solutions',
            'Real-time Network Monitoring'
        ];
        
        let messageIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        function typeMessage() {
            const currentMessage = messages[messageIndex];
            
            if (isDeleting) {
                typingElement.textContent = currentMessage.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingElement.textContent = currentMessage.substring(0, charIndex + 1);
                charIndex++;
            }
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && charIndex === currentMessage.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                messageIndex = (messageIndex + 1) % messages.length;
                typeSpeed = 500;
            }
            
            setTimeout(typeMessage, typeSpeed);
        }
        
        if (typingElement) {
            setTimeout(typeMessage, 1000);
        }
    }

    // =====================================
    // COUNTER ANIMATIONS
    // =====================================

    function setupCounters() {
        const counters = document.querySelectorAll('.counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }

    // =====================================
    // SCANNING FUNCTIONALITY - REAL TIME
    // =====================================

    async function startScan() {
        const ip = document.getElementById('ip').value.trim();
        const mode = document.getElementById('mode').value;
        const traversal = document.getElementById('traversal').value;
        const threads = parseInt(document.getElementById('threads').value);
        const outputElement = document.getElementById('output');
        const loadingElement = document.getElementById('loading');
        const scanButton = document.querySelector('button[onclick="startScan()"]');
        
        // Validation
        if (!ip) {
            showNotification('Please enter a target IP address', 'error');
            return;
        }
        
        if (!isValidIP(ip)) {
            showNotification('Please enter a valid IP address', 'error');
            return;
        }
        
        if (threads < 1 || threads > 1000) {
            showNotification('Thread count must be between 1 and 1000', 'error');
            return;
        }
        
        // Show loading and disable scan button
        loadingElement.classList.remove('hidden');
        outputElement.textContent = '🔎 Scanning in progress...';
        scanButton.disabled = true;
        
        // Create scan configuration
        const scanConfig = {
            id: generateScanId(),
            ip: ip,
            mode: mode,
            traversal: traversal,
            threads: threads,
            startTime: new Date(),
            status: 'running'
        };
        
        currentScan = scanConfig;
        
        try {
            // Make real API call to backend
            const response = await fetch('http://localhost:5000/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ip: ip,
                    start_port: 1,
                    end_port: 1024,
                    mode: mode,
                    traversal: traversal,
                    threads: threads,
                    fingerprint: true
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Complete scan with real results
                scanConfig.endTime = new Date();
                scanConfig.duration = result.scan_duration;
                scanConfig.status = 'completed';
                scanConfig.openPorts = result.open_ports;
                scanConfig.closedPorts = result.closed_ports_count;
                scanConfig.totalPorts = result.total_ports_scanned;
                scanConfig.results = `✅ Scan complete!\nOpen ports: ${result.open_ports.join(', ') || 'None'}\nRisk Level: ${result.risk_level}\nTotal Ports Scanned: ${result.total_ports_scanned}\nScan Duration: ${result.scan_duration}s`;
                
                outputElement.textContent = scanConfig.results;
                outputElement.scrollTop = outputElement.scrollHeight;

                // Save to history
                saveScanToHistory(scanConfig);
                
                // Update dashboard stats
                updateDashboardStats();
                
                showNotification('Scan completed successfully!', 'success');
                
            } else {
                throw new Error(result.error || "Unknown error occurred");
            }
            
        } catch (error) {
            scanConfig.status = 'error';
            scanConfig.error = error.message;
            outputElement.textContent = `❌ Error during scan: ${error.message}`;
            showNotification('Scan failed. Please check your connection and try again.', 'error');
        } finally {
            loadingElement.classList.add('hidden');
            scanButton.disabled = false;
            currentScan = null;
        }
    }

    // =====================================
    // HISTORY MANAGEMENT
    // =====================================

    function loadScanHistory() {
        // Load from localStorage (in a real app, this would be from a database)
        const saved = localStorage.getItem('sena_scan_history');
        if (saved) {
            try {
                scanHistory = JSON.parse(saved);
                // Convert date strings back to Date objects
                scanHistory.forEach(scan => {
                    scan.startTime = new Date(scan.startTime);
                    if (scan.endTime) scan.endTime = new Date(scan.endTime);
                });
            } catch (e) {
                console.warn('Failed to load scan history:', e);
                scanHistory = [];
            }
        }
        
        renderHistoryTable();
    }

    function saveScanToHistory(scan) {
        scanHistory.unshift(scan); // Add to beginning
        
        // Keep only last 100 scans
        if (scanHistory.length > 100) {
            scanHistory = scanHistory.slice(0, 100);
        }
        
        // Save to localStorage
        localStorage.setItem('sena_scan_history', JSON.stringify(scanHistory));
        
        renderHistoryTable();
    }

    function renderHistoryTable() {
        const tbody = document.getElementById('history-table-body');
        const emptyState = document.getElementById('history-empty');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (scanHistory.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        scanHistory.forEach((scan, index) => {
            const row = createHistoryRow(scan, index);
            tbody.appendChild(row);
        });
    }

    function createHistoryRow(scan, index) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700/50 transition-colors';
        
        const statusClass = scan.status === 'completed' ? 'status-success' : 
                        scan.status === 'error' ? 'status-error' : 'status-warning';
        
        const openPortsCount = scan.openPorts ? scan.openPorts.length : 0;
        
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-300">
                ${scan.startTime.toLocaleDateString()}<br>
                <span class="text-xs text-gray-500">${scan.startTime.toLocaleTimeString()}</span>
            </td>
            <td class="px-6 py-4 text-sm font-mono text-blue-400">${scan.ip}</td>
            <td class="px-6 py-4 text-sm text-gray-300">
                <span class="bg-gray-700 px-2 py-1 rounded text-xs uppercase">${scan.mode}</span>
            </td>
            <td class="px-6 py-4 text-sm text-green-400 font-medium">${openPortsCount}</td>
            <td class="px-6 py-4 text-sm text-gray-300">${scan.duration || 'N/A'}s</td>
            <td class="px-6 py-4">
                <span class="${statusClass}">${scan.status}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="viewScanDetails(${index})" class="action-btn action-btn-primary">
                        📊 View
                    </button>
                    <button onclick="exportPDF(${index})" class="action-btn action-btn-success">
                        📄 Export
                    </button>
                    <button onclick="deleteScan(${index})" class="action-btn action-btn-danger">
                        🗑️ Delete
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    function setupHistoryFilters() {
        const searchInput = document.getElementById('history-search');
        const filterSelect = document.getElementById('history-filter');
        
        searchInput?.addEventListener('input', debounce(filterHistory, 300));
        filterSelect?.addEventListener('change', filterHistory);
    }

    function filterHistory() {
        const searchTerm = document.getElementById('history-search')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('history-filter')?.value || 'all';
        
        let filteredHistory = [...scanHistory];
        
        // Apply search filter
        if (searchTerm) {
            filteredHistory = filteredHistory.filter(scan => 
                scan.ip.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply date filter
        const now = new Date();
        switch (filterValue) {
            case 'today':
                filteredHistory = filteredHistory.filter(scan => 
                    scan.startTime.toDateString() === now.toDateString()
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredHistory = filteredHistory.filter(scan => 
                    scan.startTime >= weekAgo
                );
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredHistory = filteredHistory.filter(scan => 
                    scan.startTime >= monthAgo
                );
                break;
        }
        
        // Re-render table with filtered data
        renderFilteredHistory(filteredHistory);
    }

    function renderFilteredHistory(filteredHistory) {
        const tbody = document.getElementById('history-table-body');
        const emptyState = document.getElementById('history-empty');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (filteredHistory.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        filteredHistory.forEach((scan, index) => {
            // Find original index in scanHistory
            const originalIndex = scanHistory.findIndex(s => s.id === scan.id);
            const row = createHistoryRow(scan, originalIndex);
            tbody.appendChild(row);
        });
    }

    function viewScanDetails(index) {
        const scan = scanHistory[index];
        if (!scan) return;
        
        const modal = document.getElementById('history-modal');
        const content = document.getElementById('history-modal-content');
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <h4 class="text-lg font-semibold text-blue-400">Scan Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-400">Target IP:</span> <span class="font-mono text-blue-400">${scan.ip}</span></p>
                            <p><span class="text-gray-400">Scan Mode:</span> <span class="uppercase">${scan.mode}</span></p>
                            <p><span class="text-gray-400">Traversal:</span> <span class="uppercase">${scan.traversal}</span></p>
                            <p><span class="text-gray-400">Threads:</span> ${scan.threads}</p>
                            <p><span class="text-gray-400">Duration:</span> ${scan.duration || 'N/A'}s</p>
                            <p><span class="text-gray-400">Status:</span> <span class="status-${scan.status === 'completed' ? 'success' : scan.status === 'error' ? 'error' : 'warning'}">${scan.status}</span></p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h4 class="text-lg font-semibold text-green-400">Results Summary</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-400">Open Ports:</span> <span class="text-green-400 font-bold">${scan.openPorts ? scan.openPorts.length : 0}</span></p>
                            <p><span class="text-gray-400">Closed Ports:</span> ${scan.closedPorts || 0}</p>
                            <p><span class="text-gray-400">Total Scanned:</span> ${scan.totalPorts || 0}</p>
                        </div>
                        ${scan.openPorts && scan.openPorts.length > 0 ? `
                            <div class="mt-4">
                                <h5 class="text-sm font-semibold text-gray-300 mb-2">Open Ports:</h5>
                                <div class="flex flex-wrap gap-2">
                                    ${scan.openPorts.map(port => `
                                        <span class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">${port}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${scan.results ? `
                    <div>
                        <h4 class="text-lg font-semibold text-purple-400 mb-4">Full Scan Output</h4>
                        <pre class="glass-effect p-4 rounded-lg text-sm font-mono h-64 overflow-auto">${scan.results}</pre>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    function closeHistoryModal() {
        const modal = document.getElementById('history-modal');
        modal.classList.add('hidden');
    }

    // Export PDF using backend
    async function exportPDF(index) {
        const scan = scanHistory[index];
        if (!scan) return;
        
        const payload = {
            scan_id: scan.id || `scan_${index}`,
            target: scan.ip,
            mode: scan.mode,
            range: "1-1024",
            open_ports: scan.openPorts || []
        };

        try {
            showNotification('Generating PDF report...', 'info');
            
            const response = await fetch('http://localhost:5000/scan/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Failed to generate PDF report");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `scan_report_${payload.scan_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('PDF report downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            showNotification('Export failed: ' + error.message, 'error');
        }
    }

    function deleteScan(index) {
        if (confirm('Are you sure you want to delete this scan?')) {
            scanHistory.splice(index, 1);
            localStorage.setItem('sena_scan_history', JSON.stringify(scanHistory));
            renderHistoryTable();
            updateDashboardStats();
            showNotification('Scan deleted successfully', 'success');
        }
    }

    function clearHistory() {
        if (confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
            scanHistory = [];
            localStorage.removeItem('sena_scan_history');
            renderHistoryTable();
            updateDashboardStats();
            showNotification('Scan history cleared', 'success');
        }
    }

    // =====================================
    // DASHBOARD STATS
    // =====================================

    function updateDashboardStats() {
        const today = new Date().toDateString();
        const dailyScans = scanHistory.filter(scan => 
            scan.startTime.toDateString() === today
        ).length;
        
        const totalScans = scanHistory.length;
        
        const threatsFound = scanHistory.reduce((total, scan) => {
            return total + (scan.openPorts ? scan.openPorts.length : 0);
        }, 0);
        
        // Update DOM elements
        const dailyScansEl = document.getElementById('daily-scans');
        const totalScansEl = document.getElementById('total-scans');
        const threatsFoundEl = document.getElementById('threats-found');
        
        if (dailyScansEl) animateNumber(dailyScansEl, dailyScans);
        if (totalScansEl) animateNumber(totalScansEl, totalScans);
        if (threatsFoundEl) animateNumber(threatsFoundEl, threatsFound);
    }

    function animateNumber(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = (target - current) / 20;
        let value = current;
        
        const timer = setInterval(() => {
            value += increment;
            if ((increment > 0 && value >= target) || (increment < 0 && value <= target)) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(value);
            }
        }, 50);
    }

    // =====================================
    // UTILITY FUNCTIONS
    // =====================================

    function isValidIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    function generateScanId() {
        return 'scan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getServiceName(port) {
        const services = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            135: 'RPC',
            139: 'NetBIOS',
            143: 'IMAP',
            443: 'HTTPS',
            993: 'IMAPS',
            995: 'POP3S',
            1723: 'PPTP',
            3389: 'RDP',
            5900: 'VNC'
        };
        return services[port] || 'Unknown';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
        
        // Set notification style based on type
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500', 'text-black');
                break;
            default:
                notification.classList.add('bg-blue-500', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-xl">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // =====================================
    // EVENT LISTENERS
    // =====================================

    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('history-modal');
        if (e.target === modal) {
            closeHistoryModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close modal
        if (e.key === 'Escape') {
            closeHistoryModal();
        }
        
        // Ctrl/Cmd + Enter to start scan (when in scanning section)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const scanningSection = document.getElementById('scanning');
            if (isElementInViewport(scanningSection)) {
                startScan();
            }
        }
    });

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Handle window resize
    window.addEventListener('resize', debounce(function() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            document.getElementById('sidebar')?.classList.remove('mobile-open');
        }
    }, 250));

    // Add loading states to buttons
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
            const originalText = e.target.innerHTML;
            if (e.target.onclick && e.target.onclick.toString().includes('startScan')) {
                // Don't modify scan button as it has its own loading state
                return;
            }
            
            e.target.style.opacity = '0.7';
            setTimeout(() => {
                e.target.style.opacity = '1';
            }, 150);
        }
    });
    console.log('🔧 SENA Dashboard JavaScript loaded successfully!');