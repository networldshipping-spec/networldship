// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// DOM Elements
const trackingInput = document.getElementById('trackingInput');
const trackBtn = document.getElementById('trackBtn');
const trackingResults = document.getElementById('trackingResults');
const trackingSection = document.querySelector('.tracking-section');
const contactForm = document.getElementById('contactForm');
const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('.nav');
const toast = document.getElementById('toast');
const loadingSpinner = document.getElementById('loadingSpinner');
const languageBtn = document.getElementById('languageBtn');
const languageDropdown = document.getElementById('languageDropdown');
const currentLangSpan = document.getElementById('currentLang');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    setupEventListeners();
    setupScrollAnimations();
    setupLanguageSelector();
});

// Event Listeners
function setupEventListeners() {
    trackBtn.addEventListener('click', handleTracking);
    trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTracking();
    });
    
    contactForm.addEventListener('submit', handleContactSubmit);
    
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Skip if href is just "#" or empty
            if (!href || href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                nav.classList.remove('active');
            }
        });
    });
    
    // Newsletter form
    document.querySelector('.newsletter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thank you for subscribing!', 'success');
        e.target.reset();
    });
    
    // Check for tracking parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) {
        trackingInput.value = trackParam;
        handleTracking();
    }
}

// Tracking Functionality
async function handleTracking() {
    const trackingNumber = trackingInput.value.trim();
    
    if (!trackingNumber) {
        showToast('Please enter a tracking number', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/tracking/${trackingNumber}`);
        const result = await response.json();
        
        if (result.success) {
            displayTrackingResults(result.data);
            trackingSection.classList.add('active');
            trackingSection.scrollIntoView({ behavior: 'smooth' });
            showToast('Tracking information loaded', 'success');
        } else {
            showToast(result.error || 'Tracking number not found', 'error');
        }
    } catch (error) {
        console.error('Error fetching tracking data:', error);
        showToast('Unable to connect to server. Please ensure the server is running.', 'error');
    } finally {
        showLoading(false);
    }
}

function displayTrackingResults(data) {
    const shipment = data.shipment;
    const timeline = data.timeline || [];
    
    // Debug: Log package image path
    console.log('Package image path:', shipment.package_image_path);
    
    const statusClass = shipment.status.toLowerCase();
    const statusText = shipment.status.replace('-', ' ').toUpperCase();
    
    // Determine active timeline item (most recent)
    const timelineHTML = timeline.map((item, index) => `
        <div class="timeline-item ${index === 0 ? 'active' : ''}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-date">${formatDateTime(item.event_date)}</div>
                <div class="timeline-status">${item.status}</div>
                <div class="timeline-location">${item.location}</div>
                ${item.description ? `<div class="timeline-description" style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">${item.description}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    trackingResults.innerHTML = `
        <div class="tracking-card">
            <div class="tracking-header">
                <div>
                    <div class="tracking-id">${shipment.tracking_number}</div>
                    <div style="color: var(--text-muted); margin-top: 0.5rem;">
                        <i class="fas fa-truck"></i> ${shipment.carrier}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="tracking-info">
                <div class="info-item">
                    <div class="info-label">Origin</div>
                    <div class="info-value">
                        <i class="fas fa-map-marker-alt" style="color: var(--primary-color);"></i>
                        ${shipment.origin}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Destination</div>
                    <div class="info-value">
                        <i class="fas fa-map-marker-alt" style="color: var(--secondary-color);"></i>
                        ${shipment.destination}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Current Location</div>
                    <div class="info-value">
                        <i class="fas fa-location-arrow" style="color: var(--accent-color);"></i>
                        ${shipment.current_location || 'N/A'}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Estimated Delivery</div>
                    <div class="info-value">
                        <i class="fas fa-calendar" style="color: var(--success-color);"></i>
                        ${shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : 'TBD'}
                    </div>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="tracking-tabs">
                <button class="tab-btn active" data-tab="timeline">
                    <i class="fas fa-route"></i>
                    <span>Timeline</span>
                </button>
                <button class="tab-btn" data-tab="location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Location</span>
                </button>
                <button class="tab-btn" data-tab="package">
                    <i class="fas fa-box"></i>
                    <span>Package Image</span>
                </button>
            </div>
            
            <!-- Tab Contents -->
            <div class="tab-content active" id="timeline-tab">
                <div class="tracking-timeline">
                    <h3 class="timeline-title">
                        <i class="fas fa-route"></i> Shipment Timeline
                    </h3>
                    <div class="timeline">
                        ${timelineHTML || '<p style="color: var(--text-muted);">No tracking events available yet.</p>'}
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="location-tab">
                <div class="location-viewer">
                    <div class="location-header">
                        <i class="fas fa-map-marked-alt"></i>
                        <h3>Current Package Location</h3>
                    </div>
                    <div class="location-card">
                        <div class="location-icon">
                            <i class="fas fa-map-pin"></i>
                        </div>
                        <div class="location-details">
                            <div class="location-city">${shipment.current_location || 'Location Unknown'}</div>
                            <div class="location-status">
                                <span class="status-dot ${statusClass}"></span>
                                ${statusText}
                            </div>
                            <div class="location-route">
                                <div class="route-point">
                                    <i class="fas fa-circle"></i>
                                    <span>${shipment.origin}</span>
                                </div>
                                <div class="route-line"></div>
                                <div class="route-point active">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${shipment.current_location || 'In Transit'}</span>
                                </div>
                                <div class="route-line"></div>
                                <div class="route-point destination">
                                    <i class="fas fa-flag-checkered"></i>
                                    <span>${shipment.destination}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="package-tab">
                <div class="package-viewer">
                    <div class="package-header">
                        <i class="fas fa-box-open"></i>
                        <h3>Package Image</h3>
                    </div>
                    ${shipment.package_image_path ? `
                        <div class="package-image-container">
                            <img src="${shipment.package_image_path.startsWith('http') ? shipment.package_image_path : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin) + shipment.package_image_path}" alt="Package Image" class="package-image" onerror="console.error('Image load failed:', this.src); this.parentElement.innerHTML='<div class=\\'image-error\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Image failed to load</p><small>' + this.src + '</small></div>'">
                            <div class="package-info">
                                <div class="package-detail">
                                    <i class="fas fa-weight"></i>
                                    <span>Weight: ${shipment.package_weight ? shipment.package_weight + ' kg' : 'N/A'}</span>
                                </div>
                                <div class="package-detail">
                                    <i class="fas fa-ruler-combined"></i>
                                    <span>Dimensions: ${shipment.package_dimensions || 'N/A'}</span>
                                </div>
                                <div class="package-detail">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Description: ${shipment.package_description || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="no-package-image">
                            <i class="fas fa-image"></i>
                            <p>No package image available</p>
                            <span>The sender did not upload a package image for this shipment</span>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    // Initialize tab switching
    initializeTabs();
}

// Contact Form Handler
function handleContactSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
    }, 1500);
}

// Animate Statistics
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateValue(element, start, end, duration) {
    const startTime = Date.now();
    const isDecimal = end.toString().includes('.');
    
    const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * easeOutQuart(progress);
        element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
        
        if (progress === 1) {
            clearInterval(timer);
        }
    }, 16);
}

function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Initialize Tabs
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            
            // Show corresponding content
            const tabName = btn.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Scroll Animations
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.feature-card, .shipment-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Loading Spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.add('active');
    } else {
        loadingSpinner.classList.remove('active');
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Active Navigation Link on Scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add parallax effect to hero background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-background');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Language Selector Setup
function setupLanguageSelector() {
    if (!languageBtn || !languageDropdown) return;
    
    // Wait for Google Translate to load
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select || checkCount > 10) {
            clearInterval(checkInterval);
            console.log('Google Translate loaded:', select ? 'Yes' : 'No');
        }
        checkCount++;
    }, 500);
    
    // Toggle dropdown
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageDropdown.classList.toggle('active');
        languageBtn.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('active');
            languageBtn.classList.remove('active');
        }
    });
    
    // Language selection
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            changeLanguage(lang);
            
            // Update display
            const langCodes = {
                'en': 'EN',
                'es': 'ES',
                'pt': 'PT',
                'fr': 'FR',
                'zh-CN': '中文',
                'hi': 'हिं',
                'el': 'ΕΛ'
            };
            currentLangSpan.textContent = langCodes[lang] || 'EN';
            
            // Close dropdown
            languageDropdown.classList.remove('active');
            languageBtn.classList.remove('active');
        });
    });
}

function changeLanguage(lang) {
    console.log('Attempting to change language to:', lang);
    
    // Method 1: Try using the select element
    const translateSelect = document.querySelector('.goog-te-combo');
    
    if (translateSelect) {
        console.log('Found translate select, changing language...');
        translateSelect.value = lang;
        translateSelect.dispatchEvent(new Event('change'));
        return;
    }
    
    // Method 2: Wait and retry multiple times
    let attempts = 0;
    const maxAttempts = 20;
    const retryInterval = setInterval(() => {
        attempts++;
        const select = document.querySelector('.goog-te-combo');
        
        if (select) {
            console.log('Found translate select on attempt', attempts);
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            clearInterval(retryInterval);
        } else if (attempts >= maxAttempts) {
            console.error('Could not find Google Translate element after', maxAttempts, 'attempts');
            clearInterval(retryInterval);
            
            // Method 3: Try direct cookie approach
            document.cookie = `googtrans=/en/${lang}; path=/`;
            document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
            window.location.reload();
        }
    }, 250);
}

// Console welcome message
console.log('%c🚚 Net World Ship v1.0', 'color: #6366f1; font-size: 24px; font-weight: bold;');
console.log('%cModern Shipment Tracking System', 'color: #ec4899; font-size: 14px;');
