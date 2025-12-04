require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const EmailReceiver = require('./emailReceiver');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Email configuration
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
};

// Create email transporter
let emailTransporter = null;
if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
    try {
        emailTransporter = nodemailer.createTransport({
            service: EMAIL_CONFIG.service,
            auth: {
                user: EMAIL_CONFIG.user,
                pass: EMAIL_CONFIG.pass
            }
        });
        console.log('📧 Email service configured');
        console.log(`   User: ${EMAIL_CONFIG.user}`);
    } catch (error) {
        console.log('⚠️  Email transporter creation failed:', error.message);
    }
} else {
    console.log('⚠️  EMAIL_USER or EMAIL_PASS not set - emails will fail');
    console.log(`   EMAIL_USER: ${EMAIL_CONFIG.user ? 'SET' : 'MISSING'}`);
    console.log(`   EMAIL_PASS: ${EMAIL_CONFIG.pass ? 'SET' : 'MISSING'}`);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const attachmentsDir = path.join(__dirname, 'uploads', 'attachments');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Configure multer for shipment receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Remove spaces and special characters from filename
        const sanitizedFilename = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, uniqueSuffix + '-' + sanitizedFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed!'));
        }
    }
});

// Configure multer for conversation attachments
const attachmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attachmentsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const attachmentUpload = multer({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for attachments
    fileFilter: (req, file, cb) => {
        // Allow common file types for attachments
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif|txt|xls|xlsx|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /pdf|msword|document|image|text|spreadsheet|zip/.test(file.mimetype);
        
        if (extname || mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('File type not allowed!'));
        }
    }
});

// PostgreSQL connection with improved timeout and retry settings
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'networld',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_HOST !== 'localhost' ? {
        rejectUnauthorized: false
    } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
});

// Test database connection and run migrations
pool.connect(async (err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('✅ Successfully connected to PostgreSQL database: networld');
        
        // Run migrations
        try {
            // Create notifications table if it doesn't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    shipment_id INTEGER NOT NULL,
                    recipient_email VARCHAR(255) NOT NULL,
                    recipient_type VARCHAR(50),
                    subject VARCHAR(500),
                    message TEXT,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'sent',
                    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ Notifications table verified/created');
            
            await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS insurance_fee DECIMAL(10, 2) DEFAULT 25.00`);
            await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customs_fee DECIMAL(10, 2) DEFAULT 50.00`);
            await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2) DEFAULT 15.00`);
            console.log('✅ Fee columns verified/added to shipments table');
            
            await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50)`);
            console.log('✅ recipient_type column verified/added to notifications table');
        } catch (migrationError) {
            console.log('⚠️  Migration note:', migrationError.message);
        }
        
        release();
    }
});

// Initialize Email Receiver
let emailReceiver = null;
if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
    emailReceiver = new EmailReceiver(EMAIL_CONFIG, pool);
    emailReceiver.connect();
    console.log('📬 Email receiver initialized - checking for customer replies every 2 minutes');
} else {
    console.log('⚠️  Email receiver not started - configure EMAIL_CONFIG first');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust Render's proxy
    cookie: {
        secure: false, // Allow HTTP for now (Render handles HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cross-origin cookies
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', database: 'connected' });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get credentials from environment
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Verify credentials
        if (username === adminUsername && password === adminPassword) {
            req.session.isAuthenticated = true;
            req.session.username = username;
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.isAuthenticated) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});

// Get all shipments (Protected)
app.get('/api/shipments', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM shipments ORDER BY created_at DESC LIMIT 20'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get shipment by tracking number
app.get('/api/tracking/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        
        // Get shipment details
        const shipmentResult = await pool.query(
            'SELECT * FROM shipments WHERE tracking_number = $1',
            [trackingNumber]
        );
        
        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tracking number not found' 
            });
        }
        
        // Get tracking events/timeline
        // Order by id DESC to show most recent updates first (based on insertion order, not event_date)
        const eventsResult = await pool.query(
            'SELECT * FROM tracking_events WHERE shipment_id = $1 ORDER BY id DESC',
            [shipmentResult.rows[0].id]
        );
        
        res.json({ 
            success: true, 
            data: {
                shipment: shipmentResult.rows[0],
                timeline: eventsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching tracking info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            path: `/uploads/${req.file.filename}`,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new shipment (Protected)
app.post('/api/shipments', requireAuth, async (req, res) => {
    try {
        const { 
            tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
            sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
            receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
            package_weight, package_dimensions, package_description, shipping_cost,
            package_image_path, package_image_filename,
            creation_date, creation_time
        } = req.body;
        
        // Build created_at timestamp from creation_date and creation_time if provided
        let createdAtValue = 'CURRENT_TIMESTAMP';
        let createdAtParam = null;
        
        if (creation_date && creation_time) {
            createdAtValue = '$26';
            createdAtParam = `${creation_date}T${creation_time}:00`;
        }
        
        const result = await pool.query(
            `INSERT INTO shipments 
            (tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
             sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
             receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
             package_weight, package_dimensions, package_description, shipping_cost,
             package_image_path, package_image_filename, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, ${createdAtValue}) 
            RETURNING *`,
            createdAtParam 
                ? [tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
                   sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
                   receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
                   package_weight, package_dimensions, package_description, shipping_cost,
                   package_image_path, package_image_filename, createdAtParam]
                : [tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
                   sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
                   receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
                   package_weight, package_dimensions, package_description, shipping_cost,
                   package_image_path, package_image_filename]
        );
        
        const newShipment = result.rows[0];
        
        // Automatically create initial tracking event (will be handled by frontend with custom date/time)
        // Note: The frontend createInitialEvent function will use the custom creation date/time
        
        res.json({ success: true, data: newShipment });
    } catch (error) {
        console.error('Error creating shipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add tracking event
app.post('/api/tracking-events', async (req, res) => {
    try {
        const { shipment_id, event_date, status, location, description } = req.body;
        
        const result = await pool.query(
            `INSERT INTO tracking_events 
            (shipment_id, event_date, status, location, description) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [shipment_id, event_date, status, location, description]
        );
        
        // Update shipment current location and status
        await pool.query(
            'UPDATE shipments SET current_location = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [location, status, shipment_id]
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding tracking event:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update shipment status
app.patch('/api/shipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, current_location } = req.body;
        
        const result = await pool.query(
            'UPDATE shipments SET status = $1, current_location = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [status, current_location, id]
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update shipment (full update) (Protected)
app.put('/api/shipments/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tracking_number, carrier, origin, destination, current_location,
            status, estimated_delivery, update_date, update_time
        } = req.body;
        
        // Get old data first
        const oldDataResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
        
        if (oldDataResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        
        const oldData = oldDataResult.rows[0];
        
        // Build updated_at timestamp from update_date and update_time if provided
        let updatedAtValue = null;
        if (update_date && update_time) {
            updatedAtValue = `${update_date}T${update_time}:00`;
        }
        
        // Update shipment (no image changes allowed in update)
        const updateQuery = updatedAtValue
            ? `UPDATE shipments 
                SET tracking_number = $1, carrier = $2, origin = $3, destination = $4, 
                    current_location = $5, status = $6, estimated_delivery = $7, 
                    updated_at = $8
                WHERE id = $9 
                RETURNING *`
            : `UPDATE shipments 
                SET tracking_number = $1, carrier = $2, origin = $3, destination = $4, 
                    current_location = $5, status = $6, estimated_delivery = $7, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8 
                RETURNING *`;
        
        const result = updatedAtValue
            ? await pool.query(updateQuery, [
                tracking_number,
                carrier,
                origin,
                destination,
                current_location || origin,
                status,
                estimated_delivery || null,
                updatedAtValue,
                id
            ])
            : await pool.query(updateQuery, [
                tracking_number,
                carrier,
                origin,
                destination,
                current_location || origin,
                status,
                estimated_delivery || null,
                id
            ]);
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            oldData: oldData
        });
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete shipment (Protected)
app.delete('/api/shipments/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete tracking events first (foreign key constraint)
        await pool.query('DELETE FROM tracking_events WHERE shipment_id = $1', [id]);
        
        // Delete shipment
        await pool.query('DELETE FROM shipments WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'Shipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting shipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Statistics endpoint
app.get('/api/statistics', async (req, res) => {
    try {
        const totalShipments = await pool.query('SELECT COUNT(*) FROM shipments');
        const inTransit = await pool.query("SELECT COUNT(*) FROM shipments WHERE status = 'in-transit'");
        const delivered = await pool.query("SELECT COUNT(*) FROM shipments WHERE status = 'delivered'");
        const pending = await pool.query("SELECT COUNT(*) FROM shipments WHERE status = 'pending'");
        
        res.json({
            success: true,
            data: {
                total: parseInt(totalShipments.rows[0].count),
                inTransit: parseInt(inTransit.rows[0].count),
                delivered: parseInt(delivered.rows[0].count),
                pending: parseInt(pending.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Notification endpoints (Protected)
app.post('/api/notifications/send', requireAuth, async (req, res) => {
    try {
        const { shipment_id, tracking_number, recipient_type, recipient_email, subject, message, receipt_html, shipment_data } = req.body;
        
        // Store notification in database
        const result = await pool.query(
            `INSERT INTO notifications 
            (shipment_id, recipient_email, subject, message, status) 
            VALUES ($1, $2, $3, $4, 'sent') 
            RETURNING *`,
            [shipment_id, recipient_email, subject, message]
        );
        
        // Send real email using Nodemailer
        if (emailTransporter) {
            try {
                const emailHTML = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                        <div style="white-space: pre-line; padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        ${receipt_html || ''}
                    </div>
                `;
                
                const mailOptions = {
                    from: `Net World Ship <${EMAIL_CONFIG.user}>`,
                    to: recipient_email,
                    replyTo: EMAIL_CONFIG.user,
                    subject: subject,
                    text: message,
                    html: emailHTML
                };
                
                // Send with 30 second timeout
                await Promise.race([
                    emailTransporter.sendMail(mailOptions),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Email timeout after 30 seconds')), 30000)
                    )
                ]);
                console.log(`✅ Email sent successfully to ${recipient_email}`);
                console.log(`Subject: ${subject}`);
                console.log(`Tracking: ${tracking_number}`);
                console.log(`Receipt included: ${receipt_html ? 'Yes (Shipment Creation)' : 'No (Status Update)'}`);
                
                // Store in conversations table as admin message
                await pool.query(
                    `INSERT INTO conversations 
                    (shipment_id, sender_type, message) 
                    VALUES ($1, 'admin', $2)`,
                    [shipment_id, message]
                );
                
                const responseMessage = receipt_html 
                    ? 'Email notification with receipt sent successfully'
                    : 'Email notification sent successfully';
                    
                res.json({ 
                    success: true, 
                    message: responseMessage,
                    data: result.rows[0]
                });
                
            } catch (emailError) {
                console.error('❌ Error sending email:', emailError.message);
                console.error('Full error:', emailError);
                
                // Return error to frontend
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to send email: ' + emailError.message,
                    error: emailError.message
                });
            }
        } else {
            // Simulation mode - no email service configured
            console.log(`📧 Email simulation - notification logged to database`);
            console.log(`To: ${recipient_email}`);
            console.log(`Subject: ${subject}`);
            console.log(`Tracking: ${tracking_number}`);
            console.log(`Receipt included: ${receipt_html ? 'Yes (Shipment Creation)' : 'No (Status Update)'}`);
            console.log(`⚠️  Configure email credentials in server.js to send real emails`);
            
            res.json({ 
                success: true, 
                message: 'Notification logged (email simulation - configure EMAIL_CONFIG to send real emails)',
                data: result.rows[0],
                emailSent: false
            });
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT n.*, s.tracking_number 
             FROM notifications n
             LEFT JOIN shipments s ON n.shipment_id = s.id
             ORDER BY n.sent_at DESC LIMIT 100`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/notifications/shipment/:shipmentId', async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE shipment_id = $1 ORDER BY sent_at DESC',
            [shipmentId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching shipment notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Contact form submission from homepage
app.post('/api/contact-message', async (req, res) => {
    try {
        const { sender_name, sender_email, tracking_number, message, subject } = req.body;
        
        let shipmentId = null;
        
        // If tracking number provided, try to find the shipment
        if (tracking_number) {
            const shipmentResult = await pool.query(
                'SELECT id FROM shipments WHERE tracking_number = $1',
                [tracking_number]
            );
            
            if (shipmentResult.rows.length > 0) {
                shipmentId = shipmentResult.rows[0].id;
            }
        }
        
        // Insert message into conversations table
        await pool.query(
            `INSERT INTO conversations 
             (shipment_id, sender_name, sender_email, subject, message, sender_type, is_read)
             VALUES ($1, $2, $3, $4, $5, 'customer', false)`,
            [shipmentId, sender_name, sender_email, subject, message]
        );
        
        console.log(`📧 Contact form message received from ${sender_name} (${sender_email})`);
        
        res.json({ 
            success: true, 
            message: 'Your message has been received. We will respond shortly!' 
        });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save message. Please try again.' 
        });
    }
});

// Conversation/Inbox endpoints (Protected)
app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM conversations 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/conversations/:trackingNumber', requireAuth, async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const result = await pool.query(
            `SELECT c.* FROM conversations c
             JOIN shipments s ON c.shipment_id = s.id
             WHERE s.tracking_number = $1 
             ORDER BY c.created_at ASC`,
            [trackingNumber]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/conversations/:trackingNumber/read', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        // is_read column removed from schema - no longer tracking read status
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/conversations/reply', requireAuth, attachmentUpload.array('attachments', 5), async (req, res) => {
    try {
        const { tracking_number, message } = req.body;
        const uploadedFiles = req.files || [];
        
        // Prepare attachment info
        const attachmentInfo = uploadedFiles.map(file => ({
            filename: file.originalname,
            path: file.filename,
            mimetype: file.mimetype,
            size: file.size
        }));
        
        // Get shipment details
        const shipment = await pool.query(
            'SELECT * FROM shipments WHERE tracking_number = $1',
            [tracking_number]
        );

        if (shipment.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Shipment not found' });
        }

        const shipmentData = shipment.rows[0];

        // Store admin reply in conversations with attachments
        await pool.query(
            `INSERT INTO conversations 
            (shipment_id, sender_type, message, attachments) 
            VALUES ($1, 'admin', $2, $3)`,
            [shipmentData.id, message, JSON.stringify(attachmentInfo)]
        );

        // Get the most recent customer message to find who to reply to
        const lastCustomerMessage = await pool.query(
            `SELECT c.* FROM conversations c
             JOIN shipments s ON c.shipment_id = s.id
             WHERE s.tracking_number = $1 AND c.sender_type != 'admin' 
             ORDER BY created_at DESC LIMIT 1`,
            [tracking_number]
        );

        if (lastCustomerMessage.rows.length > 0) {
            const customer = lastCustomerMessage.rows[0];
            const customerEmail = customer.sender_email;
            const customerName = customer.sender_name;

            // Send email reply to customer
            if (emailTransporter) {
                try {
                    // Prepare email attachments
                    const emailAttachments = uploadedFiles.map(file => ({
                        filename: file.originalname,
                        path: file.path
                    }));
                    
                    const mailOptions = {
                        from: `Net World Ship <${EMAIL_CONFIG.user}>`,
                        to: customerEmail,
                        replyTo: EMAIL_CONFIG.user,
                        subject: `Re: ${customer.subject}`,
                        text: message,
                        attachments: emailAttachments,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                                    <h2 style="margin: 0;">Net World Ship</h2>
                                </div>
                                <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                                    <p style="margin: 0 0 10px 0; color: #6b7280;">Hello ${customerName},</p>
                                    <div style="white-space: pre-line; color: #1f2937; line-height: 1.6; margin: 20px 0;">
                                        ${message}
                                    </div>
                                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                                        <strong>Tracking Number:</strong> ${tracking_number}<br>
                                        <strong>Track your shipment:</strong> <a href="${BASE_URL}/index.html?track=${tracking_number}" style="color: #3b82f6;">Click here</a>
                                    </p>
                                </div>
                                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                                    Net World Ship Team<br>
                                    support@networldship.com | +1 (800) 999-0000
                                </div>
                            </div>
                        `
                    };

                    await emailTransporter.sendMail(mailOptions);
                    console.log(`✅ Reply email sent to ${customerEmail}`);
                    
                    res.json({ success: true, message: 'Reply sent and email delivered to customer' });
                } catch (emailError) {
                    console.error('❌ Error sending reply email:', emailError);
                    res.json({ success: true, message: 'Reply saved but email delivery failed', emailError: emailError.message });
                }
            } else {
                res.json({ success: true, message: 'Reply saved (email service not configured)' });
            }
        } else {
            res.json({ success: true, message: 'Reply saved (no customer email found)' });
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/conversations/unread/count', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM conversations 
             WHERE sender_type != 'admin'`
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ count: 0 });
    }
});

// Serve attachments
app.get('/api/attachments/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(attachmentsDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Send file
        res.sendFile(filepath);
    } catch (error) {
        console.error('Error serving attachment:', error);
        res.status(500).json({ error: 'Error retrieving file' });
    }
});

// Send arrival notification with invoice
app.post('/api/send-arrival-notification', requireAuth, async (req, res) => {
    try {
        const { shipment_id, recipient_email, recipient_name, recipient_type } = req.body;

        // Get shipment details
        const shipmentResult = await pool.query(
            'SELECT * FROM shipments WHERE id = $1',
            [shipment_id]
        );

        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        const shipment = shipmentResult.rows[0];

        // Calculate invoice details
        const shippingCost = parseFloat(shipment.shipping_cost || 150.00);
        const insuranceFee = parseFloat(shipment.insurance_fee || 25.00);
        const customsFee = parseFloat(shipment.customs_fee || 50.00);
        const handlingFee = parseFloat(shipment.handling_fee || 15.00);
        const subtotal = shippingCost + insuranceFee + customsFee + handlingFee;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + tax;

        // Generate invoice HTML
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
                    .invoice-header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
                    .invoice-header h1 { margin: 0 0 10px 0; font-size: 28px; }
                    .invoice-body { padding: 30px; }
                    .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .detail-box { padding: 15px; background: #f9fafb; border-radius: 8px; }
                    .detail-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; }
                    .detail-box p { margin: 5px 0; font-size: 14px; color: #1f2937; }
                    .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .invoice-table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
                    .invoice-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                    .invoice-table tr:last-child td { border-bottom: none; }
                    .totals-section { margin-top: 20px; text-align: right; }
                    .totals-section table { margin-left: auto; width: 300px; }
                    .totals-section td { padding: 8px 0; font-size: 14px; }
                    .totals-section .total-row { font-size: 18px; font-weight: bold; color: #3b82f6; border-top: 2px solid #3b82f6; padding-top: 12px; }
                    .payment-methods { margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6; }
                    .payment-methods h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
                    .payment-option { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
                    .payment-option h4 { margin: 0 0 8px 0; color: #3b82f6; font-size: 14px; }
                    .payment-option p { margin: 5px 0; font-size: 13px; color: #4b5563; line-height: 1.6; }
                    .footer { text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="invoice-header">
                        <h1>📦 BILLING INVOICE</h1>
                        <p style="margin: 0; font-size: 14px;">Shipment Arrival - Payment Required</p>
                    </div>
                    
                    <div class="invoice-body">
                        <div style="text-align: right; margin-bottom: 20px;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">Invoice Date</p>
                            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <div class="invoice-details">
                            <div class="detail-box">
                                <h3>From (Sender)</h3>
                                <p><strong>${shipment.sender_name || 'N/A'}</strong></p>
                                <p>${shipment.sender_email || ''}</p>
                                <p>${shipment.sender_phone || ''}</p>
                                <p>${shipment.sender_address || ''}</p>
                                <p>${shipment.sender_city || ''}, ${shipment.sender_country || ''}</p>
                            </div>
                            
                            <div class="detail-box">
                                <h3>To (Receiver)</h3>
                                <p><strong>${shipment.receiver_name || 'N/A'}</strong></p>
                                <p>${shipment.receiver_email || ''}</p>
                                <p>${shipment.receiver_phone || ''}</p>
                                <p>${shipment.receiver_address || ''}</p>
                                <p>${shipment.receiver_city || ''}, ${shipment.receiver_country || ''}</p>
                            </div>
                        </div>

                        <div style="padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>📍 Shipment Status:</strong> ARRIVED</p>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;"><strong>Tracking Number:</strong> ${shipment.tracking_number}</p>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;"><strong>Current Location:</strong> ${shipment.current_location || shipment.destination}</p>
                        </div>

                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Shipping Cost (${shipment.origin} → ${shipment.destination})</td>
                                    <td>$${shippingCost.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Insurance Fee</td>
                                    <td>$${insuranceFee.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Customs Clearance Fee</td>
                                    <td>$${customsFee.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Handling & Processing Fee</td>
                                    <td>$${handlingFee.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="totals-section">
                            <table>
                                <tr>
                                    <td>Subtotal:</td>
                                    <td>$${subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Tax (8%):</td>
                                    <td>$${tax.toFixed(2)}</td>
                                </tr>
                                <tr class="total-row">
                                    <td>TOTAL DUE:</td>
                                    <td>$${total.toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="payment-methods">
                            <h3>💳 Payment Methods & Procedures</h3>
                            
                            <div class="payment-option">
                                <h4>1. Bank Transfer / Cash Deposit</h4>
                                <p><strong>Bank Name:</strong> Chase Bank</p>
                                <p><strong>Account Name:</strong> Net World Ship LLC</p>
                                <p><strong>Account Number:</strong> 1234567890</p>
                                <p><strong>Routing Number:</strong> 021000021</p>
                                <p><strong>SWIFT Code:</strong> CHASUS33</p>
                                <p><em>Please include tracking number ${shipment.tracking_number} in transfer memo or deposit slip</em></p>
                            </div>

                            <div class="payment-option" style="opacity: 0.6;">
                                <h4>2. Credit / Debit Card</h4>
                                <p style="color: #ef4444; font-weight: 600;">⚠️ Currently Unavailable</p>
                                <p>This payment method is temporarily unavailable. Please use alternative payment options below.</p>
                            </div>

                            <div class="payment-option">
                                <h4>3. PayPal / Zelle</h4>
                                <p><strong>PayPal:</strong> payments@networldship.com</p>
                                <p><strong>Zelle:</strong> +1 (800) 999-0000</p>
                                <p>Include tracking number in payment notes</p>
                            </div>

                            <div class="payment-option">
                                <h4>4. Cryptocurrency (Bitcoin/USDT)</h4>
                                <p><strong>BTC Address:</strong> bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                                <p><strong>USDT (TRC20):</strong> TY2xKgdyGjrsqtzq2N0yrf2493p83kkFjHx0wLh</p>
                                <p>Email payment confirmation to: payments@networldship.com</p>
                            </div>
                        </div>

                        <div style="margin-top: 30px; padding: 20px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                            <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px;">⚠️ Important Notice</h4>
                            <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">
                                Your shipment has arrived at the destination facility and is awaiting payment clearance. 
                                Please complete payment within <strong>72 hours</strong> to avoid storage fees ($25/day after grace period). 
                                Once payment is confirmed, your shipment will be released for final delivery.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>Net World Ship</strong></p>
                        <p>12 Harbor Boulevard, Long Beach, CA 90802</p>
                        <p>📧 support@networldship.com | 📞 +1 (800) 999-0000</p>
                        <p style="margin-top: 10px;">Track your shipment: ${BASE_URL}/index.html?track=${shipment.tracking_number}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email with invoice
        if (emailTransporter) {
            const mailOptions = {
                from: `Net World Ship <${EMAIL_CONFIG.user}>`,
                to: recipient_email,
                subject: `🚨 Payment Required - Shipment ${shipment.tracking_number} Has Arrived`,
                text: `Dear Customer,

🎉 GREAT NEWS! Your shipment has arrived at our facility!

📋 SENDER: ${shipment.sender_name || 'N/A'} (${shipment.sender_email || 'N/A'})
👤 RECEIVER: ${shipment.receiver_name || 'N/A'} (${shipment.receiver_email || 'N/A'})

Tracking Number: ${shipment.tracking_number}
Origin: ${shipment.origin}
Destination: ${shipment.destination}
Current Location: ${shipment.current_location || shipment.destination}
Status: ARRIVED - AWAITING PAYMENT

⚠️ IMPORTANT: Payment Required for Release
Your package is ready for final delivery. Please review the attached billing invoice and complete payment within 72 hours to avoid storage fees.

💰 PAYMENT AMOUNT REQUIRED: $${total.toFixed(2)} USD
(Shipping: $${shippingCost.toFixed(2)} + Insurance: $${insuranceFee.toFixed(2)} + Customs: $${customsFee.toFixed(2)} + Handling: $${handlingFee.toFixed(2)} + Tax: $${tax.toFixed(2)})

💳 PAYMENT METHODS INCLUDED:
• Bank Transfer / Cash Deposit
• Credit / Debit Card (Currently Unavailable)
• PayPal / Zelle
• Cryptocurrency (BTC/USDT)

All payment details and procedures are included in the attached invoice.

Track your shipment:
${BASE_URL}/index.html?track=${shipment.tracking_number}

For assistance, contact us immediately:
📧 support@networldship.com
📞 +1 (800) 999-0000

📄 BILLING INVOICE ATTACHED

Best regards,
Net World Ship Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
                            <h2 style="margin: 0;">📦 Shipment Arrival Notification</h2>
                        </div>
                        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; white-space: pre-line;">Dear Customer,

🎉 GREAT NEWS! Your shipment has arrived at our facility!

<strong>📋 SENDER:</strong> ${shipment.sender_name || 'N/A'} (${shipment.sender_email || 'N/A'})
<strong>👤 RECEIVER:</strong> ${shipment.receiver_name || 'N/A'} (${shipment.receiver_email || 'N/A'})

<strong>Tracking Number:</strong> ${shipment.tracking_number}
<strong>Origin:</strong> ${shipment.origin}
<strong>Destination:</strong> ${shipment.destination}
<strong>Current Location:</strong> ${shipment.current_location || shipment.destination}
<strong>Status:</strong> ARRIVED - AWAITING PAYMENT

⚠️ <strong>IMPORTANT: Payment Required for Release</strong>
Your package is ready for final delivery. Please review the attached billing invoice and complete payment within 72 hours to avoid storage fees.

💰 <strong>PAYMENT AMOUNT REQUIRED: $${total.toFixed(2)} USD</strong>
(Shipping: $${shippingCost.toFixed(2)} + Insurance: $${insuranceFee.toFixed(2)} + Customs: $${customsFee.toFixed(2)} + Handling: $${handlingFee.toFixed(2)} + Tax: $${tax.toFixed(2)})

💳 <strong>PAYMENT METHODS INCLUDED:</strong>
• Bank Transfer / Cash Deposit
• Credit / Debit Card (Currently Unavailable)
• PayPal / Zelle
• Cryptocurrency (BTC/USDT)

All payment details and procedures are included in the attached invoice.

Track your shipment:
<a href="${BASE_URL}/index.html?track=${shipment.tracking_number}" style="color: #3b82f6;">${BASE_URL}/index.html?track=${shipment.tracking_number}</a>

For assistance, contact us immediately:
📧 support@networldship.com
📞 +1 (800) 999-0000

📄 BILLING INVOICE ATTACHED

Best regards,
Net World Ship Team</p>
                        </div>
                        <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; background: #f9fafb;">
                            Net World Ship<br>
                            12 Harbor Boulevard, Long Beach, CA 90802<br>
                            support@networldship.com | +1 (800) 999-0000
                        </div>
                    </div>
                `,
                attachments: [{
                    filename: `Invoice-${shipment.tracking_number}.html`,
                    content: invoiceHTML,
                    contentType: 'text/html'
                }]
            };

            await emailTransporter.sendMail(mailOptions);
            
            // Log notification
            await pool.query(
                `INSERT INTO notifications (shipment_id, recipient_email, recipient_type, subject, message, status)
                 VALUES ($1, $2, $3, $4, $5, 'sent')`,
                [shipment_id, recipient_email, recipient_type, mailOptions.subject, 'Arrival notification with billing invoice']
            );

            res.json({ success: true, message: 'Arrival notification with invoice sent successfully' });
        } else {
            res.status(500).json({ error: 'Email service not configured' });
        }
    } catch (error) {
        console.error('Error sending arrival notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (emailReceiver) {
        emailReceiver.stop();
    }
    await pool.end();
    process.exit(0);
});
