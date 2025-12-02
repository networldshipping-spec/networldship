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
        cb(null, uniqueSuffix + '-' + file.originalname);
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

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'networld',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_HOST !== 'localhost' ? {
        rejectUnauthorized: false
    } : false
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('✅ Successfully connected to PostgreSQL database: networld');
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
        const eventsResult = await pool.query(
            'SELECT * FROM tracking_events WHERE shipment_id = $1 ORDER BY event_date DESC',
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
            package_image_path, package_image_filename
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO shipments 
            (tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
             sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
             receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
             package_weight, package_dimensions, package_description, shipping_cost,
             package_image_path, package_image_filename) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) 
            RETURNING *`,
            [tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
             sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
             receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
             package_weight, package_dimensions, package_description, shipping_cost,
             package_image_path, package_image_filename]
        );
        
        const newShipment = result.rows[0];
        
        // Automatically create initial tracking event
        const initialLocation = current_location || origin;
        const initialDescription = `Shipment created and received at ${initialLocation}`;
        
        await pool.query(
            `INSERT INTO tracking_events 
            (shipment_id, event_date, status, location, description) 
            VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)`,
            [newShipment.id, status, initialLocation, initialDescription]
        );
        
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
            status, estimated_delivery
        } = req.body;
        
        // Get old data first
        const oldDataResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
        
        if (oldDataResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        
        const oldData = oldDataResult.rows[0];
        
        // Ensure all parameters are defined
        const params = [
            tracking_number, 
            carrier, 
            origin, 
            destination, 
            current_location || origin, // Default to origin if not provided
            status, 
            estimated_delivery || null, // Ensure null if empty
            id
        ];
        
        const result = await pool.query(
            `UPDATE shipments 
            SET tracking_number = $1, carrier = $2, origin = $3, destination = $4, 
                current_location = $5, status = $6, estimated_delivery = $7, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $8 
            RETURNING *`,
            params
        );
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            oldData: oldData  // Send old data so frontend can compare changes
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

app.get('/api/notifications', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications ORDER BY sent_at DESC LIMIT 100'
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
