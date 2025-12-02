// API Configuration
const BASE_URL = window.location.origin;
const API_BASE_URL = `${BASE_URL}/api`;

// DOM Elements
const toast = document.getElementById('toast');
const loadingSpinner = document.getElementById('loadingSpinner');
const deleteModal = document.getElementById('deleteModal');
let deleteShipmentId = null;

// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check`);
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return false;
        }
        
        // Display username
        if (data.username) {
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.textContent = data.username;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Logout function
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    loadDashboardStats();
    loadRecentActivity();
    setupNavigation();
    setupForms();
    loadInboxBadge();
    
    // Set minimum date for delivery
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }
    
    // Refresh inbox badge every 30 seconds
    setInterval(loadInboxBadge, 30000);
    
    // Setup mobile menu
    setupMobileMenu();
});

// Mobile Menu
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!menuToggle) return;
    
    // Toggle menu
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    
    // Close on overlay click
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // Close on nav item click (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update active section
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        shipments: 'Manage Shipments',
        tracking: 'Tracking Events',
        create: 'Create Shipment',
        receipts: 'Shipment Receipts',
        contact: 'Contact & Notifications',
        chat: 'Customer Conversations'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Load data for specific sections
    if (section === 'contact') {
        loadNotificationHistory();
    } else if (section === 'chat') {
        loadChatStats();
    }
    
    // Load section data
    if (section === 'shipments') {
        loadAllShipments();
    } else if (section === 'dashboard') {
        loadDashboardStats();
        loadRecentActivity();
    } else if (section === 'receipts') {
        loadReceipts();
    }
}

// Dashboard
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('totalShipments').textContent = result.data.total;
            document.getElementById('inTransit').textContent = result.data.inTransit;
            document.getElementById('delivered').textContent = result.data.delivered;
            document.getElementById('pending').textContent = result.data.pending;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`);
        const result = await response.json();
        
        if (result.success) {
            const activityLog = document.getElementById('activityLog');
            const recentShipments = result.data.slice(0, 10);
            
            activityLog.innerHTML = recentShipments.map(shipment => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${shipment.tracking_number}</div>
                        <div class="activity-meta">
                            ${shipment.origin} → ${shipment.destination} • 
                            <span class="status-badge ${shipment.status}">${shipment.status}</span>
                        </div>
                    </div>
                    <div class="activity-meta">${formatDate(shipment.created_at)}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Shipments Management
async function loadAllShipments() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`);
        const result = await response.json();
        
        if (result.success) {
            displayShipments(result.data);
        }
    } catch (error) {
        console.error('Error loading shipments:', error);
        showToast('Error loading shipments', 'error');
    } finally {
        showLoading(false);
    }
}

function displayShipments(shipments) {
    const tbody = document.getElementById('shipmentsTableBody');
    
    if (shipments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No shipments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = shipments.map(shipment => `
        <tr>
            <td><strong>${shipment.tracking_number}</strong></td>
            <td>${shipment.carrier}</td>
            <td>${shipment.origin}</td>
            <td>${shipment.destination}</td>
            <td><span class="status-badge ${shipment.status}">${shipment.status}</span></td>
            <td>${shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : 'TBD'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editShipment(${shipment.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon edit" onclick="viewShipment('${shipment.tracking_number}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteShipment(${shipment.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewShipment(trackingNumber) {
    window.open(`index.html?track=${trackingNumber}`, '_blank');
}

function editShipment(id) {
    // Find shipment data
    fetch(`${API_BASE_URL}/shipments`)
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                const shipment = result.data.find(s => s.id === id);
                if (shipment) {
                    openEditModal(shipment);
                }
            }
        })
        .catch(error => console.error('Error loading shipment:', error));
}

function openEditModal(shipment) {
    // Populate edit form
    document.getElementById('editShipmentId').value = shipment.id;
    document.getElementById('editTrackingNumber').value = shipment.tracking_number || '';
    document.getElementById('editCarrier').value = shipment.carrier || '';
    document.getElementById('editOrigin').value = shipment.origin || '';
    document.getElementById('editDestination').value = shipment.destination || '';
    document.getElementById('editCurrentLocation').value = shipment.current_location || '';
    document.getElementById('editStatus').value = shipment.status || '';
    document.getElementById('editEstimatedDelivery').value = shipment.estimated_delivery ? shipment.estimated_delivery.split('T')[0] : '';
    
    // Show current image if exists
    const currentImageDiv = document.getElementById('editCurrentImage');
    if (shipment.package_image_path) {
        currentImageDiv.innerHTML = `
            <div style="margin-top: 10px;">
                <p style="font-size: 0.875rem; color: #6b7280;">Current Image:</p>
                <img src="${BASE_URL}${shipment.package_image_path}" alt="Current Package" style="max-width: 200px; border-radius: 8px; border: 2px solid #e5e7eb;">
                <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 5px;">Upload a new image to replace</p>
            </div>
        `;
    } else {
        currentImageDiv.innerHTML = '<p style="font-size: 0.875rem; color: #9ca3af;">No image uploaded</p>';
    }
    
    // Setup file upload for edit form
    setupFileUpload('editPackageImage', 'editPackageImageName');
    
    // Show modal
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function deleteShipment(id) {
    deleteShipmentId = id;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteShipmentId = null;
}

async function confirmDelete() {
    if (!deleteShipmentId) return;
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/shipments/${deleteShipmentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Shipment deleted successfully', 'success');
            closeDeleteModal();
            loadAllShipments();
            loadDashboardStats();
        } else {
            showToast('Error deleting shipment', 'error');
        }
    } catch (error) {
        console.error('Error deleting shipment:', error);
        showToast('Error deleting shipment', 'error');
    } finally {
        showLoading(false);
    }
}

// Search
document.getElementById('searchShipments')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#shipmentsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Tracking Events
async function loadTrackingEvents() {
    const trackingNumber = document.getElementById('trackingSearch').value.trim();
    
    if (!trackingNumber) {
        showToast('Please enter a tracking number', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/tracking/${trackingNumber}`);
        const result = await response.json();
        
        if (result.success) {
            displayTrackingEvents(result.data);
        } else {
            showToast('Tracking number not found', 'error');
        }
    } catch (error) {
        console.error('Error loading tracking events:', error);
        showToast('Error loading tracking events', 'error');
    } finally {
        showLoading(false);
    }
}

function displayTrackingEvents(data) {
    const container = document.getElementById('trackingEventsContainer');
    const shipment = data.shipment;
    const timeline = data.timeline || [];
    
    if (timeline.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>No tracking events found</p></div>';
        return;
    }
    
    const timelineHTML = timeline.map(event => `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${event.status}</div>
                <div style="color: var(--text-muted); font-size: 0.875rem;">
                    ${event.location} • ${formatDateTime(event.event_date)}
                </div>
                ${event.description ? `<div style="margin-top: 0.5rem; color: var(--text-secondary);">${event.description}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--dark-bg); border-radius: 12px;">
            <h3 style="margin-bottom: 1rem;">${shipment.tracking_number}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">Carrier</div>
                    <div style="font-weight: 600;">${shipment.carrier}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">Status</div>
                    <div><span class="status-badge ${shipment.status}">${shipment.status}</span></div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">Origin</div>
                    <div style="font-weight: 600;">${shipment.origin}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">Destination</div>
                    <div style="font-weight: 600;">${shipment.destination}</div>
                </div>
            </div>
        </div>
        <h3 style="margin-bottom: 1.5rem;">Timeline</h3>
        <div class="timeline">
            ${timelineHTML}
        </div>
    `;
}

// Forms
function setupForms() {
    const createForm = document.getElementById('createShipmentForm');
    createForm.addEventListener('submit', handleCreateShipment);
    
    const editForm = document.getElementById('editShipmentForm');
    if (editForm) {
        editForm.addEventListener('submit', updateShipment);
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleSendEmail);
    }
    
    // Contact search
    const contactSearch = document.getElementById('contactSearchTracking');
    if (contactSearch) {
        contactSearch.addEventListener('input', debounce(searchShipmentForContact, 500));
    }
    
    // Email template selector
    const emailTemplate = document.getElementById('emailTemplate');
    if (emailTemplate) {
        emailTemplate.addEventListener('change', () => {
            applyEmailTemplate();
            toggleReceiptNotice();
        });
    }
    
    // File upload handlers
    setupFileUpload('packageImage', 'packageImageName');
}

function setupFileUpload(inputId, displayId) {
    const fileInput = document.getElementById(inputId);
    const fileName = document.getElementById(displayId);
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    e.target.value = '';
                    fileName.textContent = '';
                    fileName.classList.remove('active');
                    return;
                }
                
                fileName.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                fileName.classList.add('active');
            } else {
                fileName.textContent = '';
                fileName.classList.remove('active');
            }
        });
    }
}

async function handleCreateShipment(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    showLoading(true);
    
    try {
        // Upload package image if it exists (optional)
        let packageImagePath = null;
        let packageImageFilename = null;
        
        const packageImage = formData.get('package_image');
        
        if (packageImage && packageImage.size > 0) {
            const uploadResult = await uploadFile(packageImage, 'package');
            if (uploadResult.success) {
                packageImagePath = uploadResult.path;
                packageImageFilename = uploadResult.filename;
            }
        }
        
        // Prepare shipment data
        const shipmentData = {
            tracking_number: formData.get('tracking_number'),
            carrier: formData.get('carrier'),
            origin: formData.get('origin'),
            destination: formData.get('destination'),
            current_location: formData.get('current_location') || formData.get('origin'),
            status: formData.get('status'),
            estimated_delivery: formData.get('estimated_delivery') || null,
            
            // Sender info
            sender_name: formData.get('sender_name'),
            sender_email: formData.get('sender_email'),
            sender_phone: formData.get('sender_phone'),
            sender_address: formData.get('sender_address'),
            sender_city: formData.get('sender_city'),
            sender_country: formData.get('sender_country'),
            
            // Receiver info
            receiver_name: formData.get('receiver_name'),
            receiver_email: formData.get('receiver_email'),
            receiver_phone: formData.get('receiver_phone'),
            receiver_address: formData.get('receiver_address'),
            receiver_city: formData.get('receiver_city'),
            receiver_country: formData.get('receiver_country'),
            
            // Package details
            package_weight: formData.get('package_weight') || null,
            package_dimensions: formData.get('package_dimensions') || null,
            package_description: formData.get('package_description') || null,
            shipping_cost: formData.get('shipping_cost') || null,
            
            // Package image (optional)
            package_image_path: packageImagePath,
            package_image_filename: packageImageFilename
        };
        
        const response = await fetch(`${API_BASE_URL}/shipments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipmentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Shipment created successfully with all details!', 'success');
            form.reset();
            
            // Reset file upload display
            document.getElementById('packageImageName').textContent = '';
            document.getElementById('packageImageName').classList.remove('active');
            
            // Create initial tracking event
            await createInitialEvent(result.data.id, shipmentData);
            
            // Refresh stats
            loadDashboardStats();
        } else {
            showToast(result.error || 'Error creating shipment', 'error');
        }
    } catch (error) {
        console.error('Error creating shipment:', error);
        showToast('Error creating shipment', 'error');
    } finally {
        showLoading(false);
    }
}

// Upload file to server
async function uploadFile(file, type) {
    try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('type', type);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: uploadData
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false };
    }
}

async function createInitialEvent(shipmentId, shipmentData) {
    try {
        await fetch(`${API_BASE_URL}/tracking-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipment_id: shipmentId,
                event_date: new Date().toISOString(),
                status: 'Package received',
                location: shipmentData.origin,
                description: `Shipment created at ${shipmentData.origin}`
            })
        });
    } catch (error) {
        console.error('Error creating event:', error);
    }
}

function showCreateForm() {
    switchSection('create');
}

async function updateShipment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const shipmentId = formData.get('id');
    
    // Upload package image if it exists (optional)
    let packageImagePath = null;
    let packageImageFilename = null;
    
    const packageImage = formData.get('package_image');
    
    if (packageImage && packageImage.size > 0) {
        const uploadResult = await uploadFile(packageImage, 'package');
        if (uploadResult) {
            packageImagePath = uploadResult.path;
            packageImageFilename = uploadResult.filename;
        }
    }
    
    const data = {
        tracking_number: formData.get('tracking_number'),
        carrier: formData.get('carrier'),
        origin: formData.get('origin'),
        destination: formData.get('destination'),
        current_location: formData.get('current_location') || formData.get('origin'),
        status: formData.get('status'),
        estimated_delivery: formData.get('estimated_delivery') || null
    };
    
    // Add image paths if uploaded
    if (packageImagePath) {
        data.package_image_path = packageImagePath;
        data.package_image_filename = packageImageFilename;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Create tracking event for the update
            const oldData = result.oldData;
            const newData = result.data;
            
            // Check what changed and create appropriate tracking event
            let changeDescription = 'Shipment information updated: ';
            const changes = [];
            
            if (oldData.status !== newData.status) {
                changes.push(`Status changed from "${oldData.status}" to "${newData.status}"`);
            }
            if (oldData.current_location !== newData.current_location) {
                changes.push(`Location updated to "${newData.current_location}"`);
            }
            if (oldData.carrier !== newData.carrier) {
                changes.push(`Carrier changed to "${newData.carrier}"`);
            }
            if (oldData.destination !== newData.destination) {
                changes.push(`Destination changed to "${newData.destination}"`);
            }
            
            if (changes.length > 0) {
                changeDescription += changes.join(', ');
                
                // Add tracking event to preserve history
                await fetch(`${API_BASE_URL}/tracking-events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shipment_id: shipmentId,
                        event_date: new Date().toISOString(),
                        status: newData.status,
                        location: newData.current_location,
                        description: changeDescription
                    })
                });
            }
            
            showToast('Shipment updated and tracking event added', 'success');
            closeEditModal();
            loadAllShipments();
            loadDashboardStats();
        } else {
            showToast(result.message || 'Error updating shipment', 'error');
        }
    } catch (error) {
        console.error('Error updating shipment:', error);
        showToast('Error updating shipment', 'error');
    } finally {
        showLoading(false);
    }
}

// Utilities
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(show) {
    loadingSpinner.classList.toggle('active', show);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Receipts Functions
async function loadReceipts() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`);
        const result = await response.json();
        
        if (result.success) {
            displayReceipts(result.data);
        }
    } catch (error) {
        console.error('Error loading receipts:', error);
        showToast('Error loading receipts', 'error');
    } finally {
        showLoading(false);
    }
}

function displayReceipts(shipments) {
    const grid = document.getElementById('receiptsGrid');
    
    if (!grid) {
        console.error('receiptsGrid element not found');
        return;
    }
    
    if (!shipments || shipments.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No shipments available</p><small>Create shipments to generate receipts</small></div>';
        return;
    }
    
    grid.innerHTML = shipments.map(shipment => `
        <div class="receipt-card" onclick="viewReceipt('${shipment.tracking_number}')">
            <div class="receipt-card-header">
                <div>
                    <div class="receipt-card-title">${shipment.tracking_number}</div>
                    <div class="receipt-card-date">${formatDate(shipment.created_at)}</div>
                </div>
                <span class="status-badge ${shipment.status}">${shipment.status}</span>
            </div>
            <div class="receipt-card-body">
                <div class="receipt-info-row">
                    <span class="receipt-info-label">From:</span>
                    <span class="receipt-info-value">${shipment.sender_name || shipment.origin}</span>
                </div>
                <div class="receipt-info-row">
                    <span class="receipt-info-label">To:</span>
                    <span class="receipt-info-value">${shipment.receiver_name || shipment.destination}</span>
                </div>
                <div class="receipt-info-row">
                    <span class="receipt-info-label">Amount:</span>
                    <span class="receipt-info-value">$${parseFloat(shipment.shipping_cost || 0).toFixed(2)}</span>
                </div>
            </div>
            <div class="receipt-card-footer">
                <button class="btn-icon edit" onclick="event.stopPropagation(); viewReceipt('${shipment.tracking_number}')" title="View Receipt">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon edit" onclick="event.stopPropagation(); printReceiptDirect('${shipment.tracking_number}')" title="Print">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function viewReceipt(trackingNumber) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`);
        const result = await response.json();
        
        if (result.success) {
            const shipment = result.data.find(s => s.tracking_number === trackingNumber);
            if (shipment) {
                generateReceipt(shipment);
                document.getElementById('receiptModal').classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error loading shipment:', error);
        showToast('Error loading receipt', 'error');
    } finally {
        showLoading(false);
    }
}

function generateReceipt(shipment) {
    const receiptContent = document.getElementById('receiptContent');
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-logo">
                <i class="fas fa-shipping-fast receipt-logo-icon"></i>
                <div class="receipt-logo-text">Net World Ship</div>
                <div class="receipt-logo-tagline">Global Shipping Solutions</div>
            </div>
            <div class="receipt-company-info">
                <strong>Net World Ship</strong><br>
                123 Logistics Avenue<br>
                Long Beach, CA 90802<br>
                Phone: +1 (800) 999-0000<br>
                Email: support@networldship.com
            </div>
        </div>
        
        <h1 class="receipt-title">Shipping Receipt</h1>
        <p class="receipt-subtitle">Receipt Date: ${currentDate}</p>
        
        <div class="receipt-details-grid">
            <div class="receipt-detail-box">
                <h4><i class="fas fa-user"></i> Sender Information</h4>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Name:</span>
                    <span class="receipt-detail-value">${shipment.sender_name || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Email:</span>
                    <span class="receipt-detail-value">${shipment.sender_email || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Phone:</span>
                    <span class="receipt-detail-value">${shipment.sender_phone || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Address:</span>
                    <span class="receipt-detail-value">${shipment.sender_address || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">City:</span>
                    <span class="receipt-detail-value">${shipment.sender_city || 'N/A'}, ${shipment.sender_country || ''}</span>
                </div>
            </div>
            
            <div class="receipt-detail-box">
                <h4><i class="fas fa-map-marker-alt"></i> Receiver Information</h4>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Name:</span>
                    <span class="receipt-detail-value">${shipment.receiver_name || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Email:</span>
                    <span class="receipt-detail-value">${shipment.receiver_email || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Phone:</span>
                    <span class="receipt-detail-value">${shipment.receiver_phone || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">Address:</span>
                    <span class="receipt-detail-value">${shipment.receiver_address || 'N/A'}</span>
                </div>
                <div class="receipt-detail-row">
                    <span class="receipt-detail-label">City:</span>
                    <span class="receipt-detail-value">${shipment.receiver_city || 'N/A'}, ${shipment.receiver_country || ''}</span>
                </div>
            </div>
        </div>
        
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Details</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Tracking Number</strong></td>
                    <td>${shipment.tracking_number}</td>
                    <td></td>
                </tr>
                <tr>
                    <td><strong>Carrier</strong></td>
                    <td>${shipment.carrier}</td>
                    <td></td>
                </tr>
                <tr>
                    <td><strong>Service Type</strong></td>
                    <td>${shipment.status === 'in-transit' ? 'Express Shipping' : 'Standard Shipping'}</td>
                    <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.8).toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Package Details</strong></td>
                    <td>${shipment.package_description || 'Standard Package'}<br>
                        Weight: ${shipment.package_weight || 'N/A'} kg<br>
                        Dimensions: ${shipment.package_dimensions || 'N/A'}
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td><strong>Insurance</strong></td>
                    <td>Standard Coverage</td>
                    <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Handling Fee</strong></td>
                    <td>Processing & Packaging</td>
                    <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="receipt-total-section">
            <div class="receipt-total-box">
                <div class="receipt-total-row">
                    <span class="receipt-total-label">Subtotal:</span>
                    <span class="receipt-total-value">$${(parseFloat(shipment.shipping_cost || 0) * 0.9).toFixed(2)}</span>
                </div>
                <div class="receipt-total-row">
                    <span class="receipt-total-label">Tax (10%):</span>
                    <span class="receipt-total-value">$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</span>
                </div>
                <div class="receipt-total-row receipt-total-final">
                    <span class="receipt-total-label">Total Amount:</span>
                    <span class="receipt-total-value">$${parseFloat(shipment.shipping_cost || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="receipt-barcode">
            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Scan to Track</div>
            <div id="qrcode-container" style="display: flex; justify-content: center; margin: 1rem 0;"></div>
            <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">Tracking Number</div>
            <div class="receipt-tracking-large">${shipment.tracking_number}</div>
        </div>
        
        <div class="receipt-footer">
            <div class="receipt-footer-text">
                <strong>Thank you for choosing Net World Ship!</strong><br>
                This is an official receipt for your shipment. Please keep it for your records.<br>
                For tracking updates, visit www.networldship.com or call our 24/7 support line.<br><br>
                <strong>Origin:</strong> ${shipment.origin} | <strong>Destination:</strong> ${shipment.destination}<br>
                <strong>Status:</strong> ${shipment.status.toUpperCase()} | <strong>Estimated Delivery:</strong> ${formatDate(shipment.estimated_delivery)}<br><br>
                <em>This is a computer-generated receipt and does not require a signature.</em>
            </div>
        </div>
    `;
    
    // Generate QR Code after content is rendered
    setTimeout(() => {
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
            qrContainer.innerHTML = ''; // Clear any existing QR code
            const trackingURL = `${BASE_URL}/index.html?track=${shipment.tracking_number}`;
            new QRCode(qrContainer, {
                text: trackingURL,
                width: 150,
                height: 150,
                colorDark: "#1e293b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
}

function printReceipt() {
    window.print();
}

async function printReceiptDirect(trackingNumber) {
    await viewReceipt(trackingNumber);
    setTimeout(() => {
        window.print();
    }, 500);
}

function generateAllReceipts() {
    showToast('Generating all receipts...', 'info');
    // Implementation for batch receipt generation
}

// Contact & Notification Functions
let currentShipmentForContact = null;

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

async function searchShipmentForContact() {
    const searchValue = document.getElementById('contactSearchTracking').value.trim();
    
    if (!searchValue) {
        document.getElementById('shipmentContactInfo').style.display = 'none';
        document.getElementById('noShipmentSelected').style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`);
        const result = await response.json();
        
        if (result.success) {
            const shipment = result.data.find(s => 
                s.tracking_number.toLowerCase().includes(searchValue.toLowerCase())
            );
            
            if (shipment) {
                currentShipmentForContact = shipment;
                displayShipmentContactInfo(shipment);
            } else {
                showToast('Shipment not found', 'error');
                document.getElementById('shipmentContactInfo').style.display = 'none';
                document.getElementById('noShipmentSelected').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error searching shipment:', error);
        showToast('Error searching shipment', 'error');
    }
}

function displayShipmentContactInfo(shipment) {
    document.getElementById('noShipmentSelected').style.display = 'none';
    document.getElementById('shipmentContactInfo').style.display = 'block';
    
    // Display sender info
    document.getElementById('senderName').textContent = shipment.sender_name || 'N/A';
    document.getElementById('senderEmail').textContent = shipment.sender_email || 'No email';
    
    // Display receiver info
    document.getElementById('receiverName').textContent = shipment.receiver_name || 'N/A';
    document.getElementById('receiverEmail').textContent = shipment.receiver_email || 'No email';
    
    // Store shipment ID
    document.getElementById('selectedShipmentId').value = shipment.id;
    
    // Reset form
    document.getElementById('recipientEmail').value = '';
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailMessage').value = '';
    document.getElementById('selectedRecipientType').value = '';
}

function selectRecipient(type) {
    if (!currentShipmentForContact) return;
    
    let email, name;
    if (type === 'sender') {
        email = currentShipmentForContact.sender_email;
        name = currentShipmentForContact.sender_name;
    } else {
        email = currentShipmentForContact.receiver_email;
        name = currentShipmentForContact.receiver_name;
    }
    
    if (!email) {
        showToast('No email address available for this recipient', 'error');
        return;
    }
    
    document.getElementById('recipientEmail').value = email;
    document.getElementById('selectedRecipientType').value = type;
    document.getElementById('emailSubject').value = `Net World Ship - Shipment Update ${currentShipmentForContact.tracking_number}`;
    
    showToast(`Selected ${type}: ${name}`, 'success');
}

function toggleReceiptNotice() {
    const template = document.getElementById('emailTemplate').value;
    const receiptNotice = document.getElementById('receiptNotice');
    
    if (receiptNotice) {
        // Only show receipt notice for "created" template
        receiptNotice.style.display = template === 'created' ? 'flex' : 'none';
    }
}

function generateReceiptForEmail(shipment) {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .receipt-header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .receipt-logo-text { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .receipt-logo-tagline { font-size: 14px; opacity: 0.9; }
        h1 { color: #1e293b; margin: 20px 0 10px; }
        .receipt-subtitle { color: #64748b; margin-bottom: 30px; }
        .receipt-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .receipt-detail-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        .receipt-detail-box h4 { color: #6366f1; margin: 0 0 15px 0; font-size: 16px; }
        .receipt-detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .receipt-detail-label { font-weight: bold; color: #64748b; }
        .receipt-detail-value { color: #1e293b; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { background: #6366f1; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        tbody tr:hover { background: #f8fafc; }
        .receipt-total-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; }
        .receipt-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
        .receipt-total-row:last-child { border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px; margin-top: 10px; font-size: 22px; font-weight: bold; }
        .receipt-footer { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; color: #64748b; font-size: 14px; line-height: 1.8; }
        .receipt-footer strong { color: #1e293b; }
    </style>
</head>
<body>
    <div class="receipt-header">
        <div class="receipt-logo-text">Net World Ship</div>
        <div class="receipt-logo-tagline">Global Shipping Solutions</div>
        <div style="margin-top: 15px; font-size: 14px;">
            12 Harbor Boulevard, Long Beach, CA 90802<br>
            Phone: +1 (800) 999-0000 | Email: support@networldship.com
        </div>
    </div>
    
    <h1>Shipping Receipt</h1>
    <p class="receipt-subtitle">Receipt Date: ${currentDate}</p>
    
    <div class="receipt-details-grid">
        <div class="receipt-detail-box">
            <h4>👤 Sender Information</h4>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Name:</span>
                <span class="receipt-detail-value">${shipment.sender_name || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Email:</span>
                <span class="receipt-detail-value">${shipment.sender_email || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Phone:</span>
                <span class="receipt-detail-value">${shipment.sender_phone || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Address:</span>
                <span class="receipt-detail-value">${shipment.sender_address || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">City:</span>
                <span class="receipt-detail-value">${shipment.sender_city || 'N/A'}, ${shipment.sender_country || ''}</span>
            </div>
        </div>
        
        <div class="receipt-detail-box">
            <h4>📍 Receiver Information</h4>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Name:</span>
                <span class="receipt-detail-value">${shipment.receiver_name || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Email:</span>
                <span class="receipt-detail-value">${shipment.receiver_email || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Phone:</span>
                <span class="receipt-detail-value">${shipment.receiver_phone || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">Address:</span>
                <span class="receipt-detail-value">${shipment.receiver_address || 'N/A'}</span>
            </div>
            <div class="receipt-detail-row">
                <span class="receipt-detail-label">City:</span>
                <span class="receipt-detail-value">${shipment.receiver_city || 'N/A'}, ${shipment.receiver_country || ''}</span>
            </div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Details</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Tracking Number</strong></td>
                <td>${shipment.tracking_number}</td>
                <td></td>
            </tr>
            <tr>
                <td><strong>Carrier</strong></td>
                <td>${shipment.carrier}</td>
                <td></td>
            </tr>
            <tr>
                <td><strong>Service Type</strong></td>
                <td>${shipment.status === 'in-transit' ? 'Express Shipping' : 'Standard Shipping'}</td>
                <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.8).toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Package Details</strong></td>
                <td>${shipment.package_description || 'Standard Package'}<br>
                    Weight: ${shipment.package_weight || 'N/A'} kg<br>
                    Dimensions: ${shipment.package_dimensions || 'N/A'}
                </td>
                <td></td>
            </tr>
            <tr>
                <td><strong>Insurance</strong></td>
                <td>Standard Coverage</td>
                <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Handling Fee</strong></td>
                <td>Processing & Packaging</td>
                <td style="text-align: right;">$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</td>
            </tr>
        </tbody>
    </table>
    
    <div class="receipt-total-section">
        <div class="receipt-total-row">
            <span>Subtotal:</span>
            <span>$${(parseFloat(shipment.shipping_cost || 0) * 0.9).toFixed(2)}</span>
        </div>
        <div class="receipt-total-row">
            <span>Tax (10%):</span>
            <span>$${(parseFloat(shipment.shipping_cost || 0) * 0.1).toFixed(2)}</span>
        </div>
        <div class="receipt-total-row">
            <span>TOTAL AMOUNT:</span>
            <span>$${parseFloat(shipment.shipping_cost || 0).toFixed(2)}</span>
        </div>
    </div>
    
    <div class="receipt-footer">
        <strong>Thank you for choosing Net World Ship!</strong><br>
        This is an official receipt for your shipment. Please keep it for your records.<br>
        <strong>Origin:</strong> ${shipment.origin} | <strong>Destination:</strong> ${shipment.destination}<br>
        <strong>Status:</strong> ${shipment.status.toUpperCase()} | <strong>Estimated Delivery:</strong> ${shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : 'TBD'}<br><br>
        Track your shipment: <a href="${BASE_URL}/index.html?track=${shipment.tracking_number}">Click here to track</a><br>
        <em>This is a computer-generated receipt and does not require a signature.</em>
    </div>
</body>
</html>
    `.trim();
}

function applyEmailTemplate() {
    const template = document.getElementById('emailTemplate').value;
    const messageBox = document.getElementById('emailMessage');
    
    if (!currentShipmentForContact || !template) return;
    
    const trackingNumber = currentShipmentForContact.tracking_number;
    const status = currentShipmentForContact.status.replace('-', ' ').toUpperCase();
    const origin = currentShipmentForContact.origin;
    const destination = currentShipmentForContact.destination;
    const trackingURL = `${BASE_URL}/index.html?track=${trackingNumber}`;
    
    let message = '';
    
    switch(template) {
        case 'created':
            message = `Dear Customer,

Your shipment has been created and is being processed by Net World Ship.

Tracking Number: ${trackingNumber}
Origin: ${origin}
Destination: ${destination}
Status: ${status}

You can track your shipment anytime at:
${trackingURL}

📄 SHIPMENT RECEIPT ATTACHED
Please see the attached receipt for complete shipment details including sender/receiver information, package details, and shipping costs.

Thank you for choosing Net World Ship!

Best regards,
Net World Ship Team
support@networldship.com
+1 (800) 999-0000`;
            break;
            
        case 'update':
            message = `Dear Customer,

Your shipment status has been updated.

Tracking Number: ${trackingNumber}
Current Status: ${status}
Current Location: ${currentShipmentForContact.current_location || 'In Transit'}

Track your shipment:
${trackingURL}

For any questions, please contact our support team.

Best regards,
Net World Ship Team
support@networldship.com
+1 (800) 999-0000`;
            break;
            
        case 'delivered':
            message = `Dear Customer,

Great news! Your shipment has been successfully delivered!

Tracking Number: ${trackingNumber}
Delivered From: ${origin}
Delivered To: ${destination}

Thank you for choosing Net World Ship for your shipping needs. We hope to serve you again soon!

If you have any questions about your delivery, please contact us.

Best regards,
Net World Ship Team
support@networldship.com
+1 (800) 999-0000`;
            break;
    }
    
    messageBox.value = message;
}

async function handleSendEmail(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const template = formData.get('template');
    
    // Only include receipt for shipment creation
    const includeReceipt = template === 'created';
    const receiptHTML = includeReceipt ? generateReceiptForEmail(currentShipmentForContact) : null;
    
    const emailData = {
        shipment_id: formData.get('shipment_id'),
        recipient_type: formData.get('recipient_type'),
        recipient_email: formData.get('recipient_email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        tracking_number: currentShipmentForContact.tracking_number,
        receipt_html: receiptHTML,
        shipment_data: currentShipmentForContact,
        include_receipt: includeReceipt
    };
    
    if (!emailData.recipient_type) {
        showToast('Please select a recipient (Sender or Receiver)', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const successMsg = includeReceipt 
                ? 'Email notification with receipt sent successfully!' 
                : 'Email notification sent successfully!';
            showToast(successMsg, 'success');
            e.target.reset();
            loadNotificationHistory();
        } else {
            showToast(result.error || 'Failed to send email', 'error');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        showToast('Email sent (simulated - configure SMTP for real emails)', 'info');
        
        // Store notification in localStorage as fallback
        storeNotification(emailData);
        loadNotificationHistory();
        e.target.reset();
    } finally {
        showLoading(false);
    }
}

function storeNotification(emailData) {
    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
        date: new Date().toISOString(),
        tracking_number: emailData.tracking_number,
        recipient: emailData.recipient_email,
        type: emailData.recipient_type,
        subject: emailData.subject,
        status: 'sent'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)));
}

async function loadNotificationHistory() {
    const tableBody = document.getElementById('notificationsTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            tableBody.innerHTML = result.data.map(notif => `
                <tr>
                    <td>${formatDateTime(notif.sent_at)}</td>
                    <td><strong>${notif.tracking_number}</strong></td>
                    <td>${notif.recipient_email}</td>
                    <td><span class="badge badge-${notif.recipient_type}">${notif.recipient_type.toUpperCase()}</span></td>
                    <td>${notif.subject}</td>
                    <td><span class="status-badge delivered">${notif.status.toUpperCase()}</span></td>
                </tr>
            `).join('');
        } else {
            // Fallback to localStorage
            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            if (notifications.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No notifications sent yet</td></tr>';
            } else {
                tableBody.innerHTML = notifications.map(notif => `
                    <tr>
                        <td>${formatDateTime(notif.date)}</td>
                        <td><strong>${notif.tracking_number}</strong></td>
                        <td>${notif.recipient}</td>
                        <td><span class="badge badge-${notif.type}">${notif.type.toUpperCase()}</span></td>
                        <td>${notif.subject}</td>
                        <td><span class="status-badge delivered">${notif.status.toUpperCase()}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">Error loading notifications</td></tr>';
    }
}

function generateAllReceipts_old() {
    showToast('Generating all receipts...', 'success');
    window.print();
}

// Search receipts
document.getElementById('searchReceipts')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.receipt-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Load inbox badge count
async function loadInboxBadge() {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/unread/count`);
        const data = await response.json();
        const count = data.count || 0;
        
        // Update bell icon badge
        const badge = document.getElementById('inboxBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Update chat nav badge
        const chatNavBadge = document.getElementById('chatNavBadge');
        if (chatNavBadge) {
            chatNavBadge.textContent = count;
            chatNavBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    } catch (error) {
        console.error('Error loading inbox badge:', error);
    }
}

// Load chat statistics
async function loadChatStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations`);
        const conversations = await response.json();
        
        // Group by tracking number
        const groupedConversations = {};
        conversations.forEach(msg => {
            if (!groupedConversations[msg.tracking_number]) {
                groupedConversations[msg.tracking_number] = {
                    messages: [],
                    unread_count: 0
                };
            }
            groupedConversations[msg.tracking_number].messages.push(msg);
            if (!msg.is_read && msg.sender_type !== 'admin') {
                groupedConversations[msg.tracking_number].unread_count++;
            }
        });
        
        const totalConversations = Object.keys(groupedConversations).length;
        const unreadCount = Object.values(groupedConversations).reduce((sum, conv) => sum + conv.unread_count, 0);
        
        // Count today's messages
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMessages = conversations.filter(msg => new Date(msg.created_at) >= today).length;
        
        // Update stats
        document.getElementById('chatStatsTotal').textContent = totalConversations;
        document.getElementById('chatStatsUnread').textContent = unreadCount;
        document.getElementById('chatStatsToday').textContent = todayMessages;
        
    } catch (error) {
        console.error('Error loading chat stats:', error);
    }
}

// Console
console.log('%c🔐 Admin Panel', 'color: #6366f1; font-size: 24px; font-weight: bold;');
console.log('%cNet World Ship Management System', 'color: #ec4899; font-size: 14px;');
