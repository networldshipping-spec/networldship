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
const navOverlay = document.getElementById('navOverlay');
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
        navOverlay.classList.toggle('active');
    });
    
    // Close menu when overlay is clicked
    navOverlay.addEventListener('click', () => {
        nav.classList.remove('active');
        navOverlay.classList.remove('active');
    });
    
    // Close menu when a nav link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            navOverlay.classList.remove('active');
        });
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
    console.log('Full shipment data:', shipment);
    console.log('Is mobile:', window.innerWidth <= 768);
    
    const statusClass = shipment.status.toLowerCase();
    const statusText = shipment.status.replace('-', ' ').toUpperCase();
    
    // Separate creation event from updates
    const creationEvent = timeline.find(item => item.status === 'shipment-created');
    const updateEvents = timeline.filter(item => item.status !== 'shipment-created');
    
    // Build timeline HTML: updates first (DESC order), then creation at bottom
    const updatesHTML = updateEvents.map((item, index) => `
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
    
    const creationHTML = creationEvent ? `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-date">${formatDateTime(creationEvent.event_date)}</div>
                <div class="timeline-status">${creationEvent.status}</div>
                <div class="timeline-location">${creationEvent.location}</div>
                ${creationEvent.description ? `<div class="timeline-description" style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">${creationEvent.description}</div>` : ''}
            </div>
        </div>
    ` : '';
    
    // Add invoice/receipt as last timeline item
    const invoiceHTML = (shipment.invoice_path || shipment.receipt_path) ? `
        <div class="timeline-item timeline-invoice">
            <div class="timeline-marker" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));"></div>
            <div class="timeline-content">
                <div class="timeline-date">${formatDateTime(shipment.shipment_date)}</div>
                <div class="timeline-status" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white;">Shipment Invoice</div>
                <div class="timeline-location">Documents Available</div>
                <div class="timeline-invoice-docs" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    ${shipment.invoice_path ? `
                        <a href="${shipment.invoice_path}" target="_blank" class="invoice-timeline-link">
                            <i class="fas fa-file-invoice"></i>
                            <span>Download Invoice</span>
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                    ${shipment.receipt_path ? `
                        <a href="${shipment.receipt_path}" target="_blank" class="invoice-timeline-link">
                            <i class="fas fa-receipt"></i>
                            <span>Download Receipt</span>
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    ` : '';
    
    const timelineHTML = updatesHTML + creationHTML + invoiceHTML;
    
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

            <!-- Package Information -->
            <div class="tracking-info" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div class="info-item">
                    <div class="info-label">Sender</div>
                    <div class="info-value">
                        <i class="fas fa-user" style="color: var(--primary-color);"></i>
                        ${shipment.sender_name || 'N/A'}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Receiver</div>
                    <div class="info-value">
                        <i class="fas fa-user-tag" style="color: var(--secondary-color);"></i>
                        ${shipment.receiver_name || 'N/A'}
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
                <button class="tab-btn" data-tab="invoice">
                    <i class="fas fa-file-invoice"></i>
                    <span>Shipment Invoice</span>
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
                            <img src="${shipment.package_image_path.startsWith('http') ? shipment.package_image_path : shipment.package_image_path}" alt="Package Image" class="package-image" onerror="console.error('Image load failed:', this.src); this.parentElement.innerHTML='<div class=\\'image-error\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Image failed to load</p><small>' + this.src + '</small></div>'" loading="lazy">
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
            
            <div class="tab-content" id="invoice-tab">
                <div class="invoice-viewer">
                    <div class="invoice-header">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <h3>Shipment Invoice / Receipt</h3>
                    </div>
                    ${shipment.invoice_path || shipment.receipt_path ? `
                        <div class="invoice-container">
                            <div class="invoice-preview">
                                ${shipment.invoice_path ? `
                                    <div class="invoice-document">
                                        <div class="document-icon">
                                            <i class="fas fa-file-pdf"></i>
                                        </div>
                                        <div class="document-info">
                                            <h4>Invoice Document</h4>
                                            <p>${shipment.invoice_filename || 'invoice.pdf'}</p>
                                        </div>
                                        <a href="${shipment.invoice_path}" target="_blank" class="btn-download">
                                            <i class="fas fa-download"></i> Download
                                        </a>
                                    </div>
                                ` : ''}
                                ${shipment.receipt_path ? `
                                    <div class="invoice-document">
                                        <div class="document-icon">
                                            <i class="fas fa-receipt"></i>
                                        </div>
                                        <div class="document-info">
                                            <h4>Receipt Document</h4>
                                            <p>${shipment.receipt_filename || 'receipt.pdf'}</p>
                                        </div>
                                        <a href="${shipment.receipt_path}" target="_blank" class="btn-download">
                                            <i class="fas fa-download"></i> Download
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="invoice-details">
                                <div class="invoice-detail-item">
                                    <i class="fas fa-hashtag"></i>
                                    <span>Tracking #: ${shipment.tracking_number}</span>
                                </div>
                                <div class="invoice-detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>Date: ${formatDate(shipment.shipment_date)}</span>
                                </div>
                                <div class="invoice-detail-item">
                                    <i class="fas fa-user"></i>
                                    <span>Sender: ${shipment.sender_name || 'N/A'}</span>
                                </div>
                                <div class="invoice-detail-item">
                                    <i class="fas fa-user-tag"></i>
                                    <span>Receiver: ${shipment.receiver_name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="no-invoice">
                            <i class="fas fa-file-invoice"></i>
                            <p>No invoice or receipt available</p>
                            <span>Invoice and receipt documents will be uploaded once available</span>
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
async function handleContactSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const trackingNumber = formData.get('tracking_number');
    const message = formData.get('message');
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender_name: name,
                sender_email: email,
                tracking_number: trackingNumber || null,
                message: message,
                subject: trackingNumber ? `Contact Form: ${trackingNumber}` : 'General Inquiry from Website'
            })
        });
        
        const result = await response.json();
        
        showLoading(false);
        
        if (result.success) {
            showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            contactForm.reset();
        } else {
            showToast('Failed to send message. Please try again or email us directly.', 'error');
        }
    } catch (error) {
        console.error('Error sending contact message:', error);
        showLoading(false);
        showToast('Failed to send message. Please email us at support@networldship.com', 'error');
    }
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
    
    // Helper to restore dropdown to its original location (if moved)
    function restoreLanguageDropdown() {
        if (languageDropdown.__originalParent) {
            try {
                if (languageDropdown.__originalNext) {
                    languageDropdown.__originalParent.insertBefore(languageDropdown, languageDropdown.__originalNext);
                } else {
                    languageDropdown.__originalParent.appendChild(languageDropdown);
                }
            } catch (err) {
                // fallback: append to parent
                languageDropdown.__originalParent.appendChild(languageDropdown);
            }
            languageDropdown.classList.remove('mobile-appended');
            // clear inline styles applied for mobile
            languageDropdown.style.position = '';
            languageDropdown.style.top = '';
            languageDropdown.style.right = '';
            languageDropdown.style.left = '';
            languageDropdown.style.minWidth = '';
            languageDropdown.style.zIndex = '';
            languageDropdown.style.transform = '';
            languageDropdown.style.opacity = '';
            languageDropdown.style.visibility = '';
            delete languageDropdown.__originalParent;
            delete languageDropdown.__originalNext;
        }
        languageDropdown.classList.remove('active');
        languageBtn.classList.remove('active');
    }

    // Toggle dropdown
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // If not already moved, move it to body and position fixed so it sits above content
            if (!languageDropdown.classList.contains('mobile-appended')) {
                languageDropdown.__originalParent = languageDropdown.parentNode;
                languageDropdown.__originalNext = languageDropdown.nextSibling;
                document.body.appendChild(languageDropdown);
                languageDropdown.classList.add('mobile-appended');

                const header = document.querySelector('.header');
                const headerBottom = header ? (header.getBoundingClientRect().bottom + window.scrollY) : (56 + window.scrollY);
                languageDropdown.style.position = 'fixed';
                languageDropdown.style.top = (headerBottom + 8) + 'px';
                languageDropdown.style.right = '0.75rem';
                languageDropdown.style.left = '0.75rem';
                languageDropdown.style.minWidth = 'auto';
                languageDropdown.style.zIndex = '20000';
                languageDropdown.style.transform = 'translateY(0)';
                languageDropdown.style.opacity = '1';
                languageDropdown.style.visibility = 'visible';
                languageDropdown.classList.add('active');
                languageBtn.classList.add('active');
            } else {
                // already appended -> restore
                restoreLanguageDropdown();
            }
        } else {
            languageDropdown.classList.toggle('active');
            languageBtn.classList.toggle('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            // restore if mobile-appended
            if (languageDropdown.classList.contains('mobile-appended')) {
                restoreLanguageDropdown();
            } else {
                languageDropdown.classList.remove('active');
                languageBtn.classList.remove('active');
            }
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
            if (currentLangSpan) {
                currentLangSpan.textContent = langCodes[lang] || 'EN';
            }

            // Close dropdown
            if (languageDropdown.classList.contains('mobile-appended')) {
                restoreLanguageDropdown();
            } else {
                languageDropdown.classList.remove('active');
                languageBtn.classList.remove('active');
            }
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
