const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class EmailReceiver {
    constructor(emailConfig, dbPool) {
        this.config = emailConfig;
        this.pool = dbPool;
        this.imap = null;
        this.isProcessing = false;
        this.checkInterval = 2 * 60 * 1000; // Check every 2 minutes
        this.processedEmails = new Set(); // Track processed email IDs
        
        // Create attachments directory
        this.attachmentsDir = path.join(__dirname, 'uploads', 'attachments');
        if (!fs.existsSync(this.attachmentsDir)) {
            fs.mkdirSync(this.attachmentsDir, { recursive: true });
        }
    }

    // Initialize IMAP connection
    connect() {
        this.imap = new Imap({
            user: this.config.user,
            password: this.config.pass,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        this.imap.once('ready', () => {
            console.log('📬 Email receiver connected to Gmail IMAP');
            this.startChecking();
        });

        this.imap.once('error', (err) => {
            console.error('❌ IMAP connection error:', err.message);
        });

        this.imap.once('end', () => {
            console.log('📭 IMAP connection ended');
        });

        this.imap.connect();
    }

    // Start periodic email checking
    startChecking() {
        // Check immediately
        this.checkForNewEmails();
        
        // Then check every 2 minutes
        setInterval(() => {
            this.checkForNewEmails();
        }, this.checkInterval);
    }

    // Check inbox for new emails
    async checkForNewEmails() {
        if (this.isProcessing) {
            console.log('⏳ Already processing emails, skipping...');
            return;
        }

        this.isProcessing = true;

        try {
            this.imap.openBox('INBOX', false, async (err, box) => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    this.isProcessing = false;
                    return;
                }

                // Search for unread emails
                this.imap.search(['UNSEEN'], async (err, results) => {
                    if (err) {
                        console.error('Error searching emails:', err);
                        this.isProcessing = false;
                        return;
                    }

                    if (!results || results.length === 0) {
                        console.log('📭 No new emails');
                        this.isProcessing = false;
                        return;
                    }

                    console.log(`📨 Found ${results.length} new email(s)`);

                    const fetch = this.imap.fetch(results, {
                        bodies: '',
                        markSeen: true
                    });

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error('Error parsing email:', err);
                                    return;
                                }

                                await this.processEmail(parsed, seqno);
                            });
                        });
                    });

                    fetch.once('error', (err) => {
                        console.error('Fetch error:', err);
                        this.isProcessing = false;
                    });

                    fetch.once('end', () => {
                        console.log('✅ Finished processing emails');
                        this.isProcessing = false;
                    });
                });
            });
        } catch (error) {
            console.error('Error checking emails:', error);
            this.isProcessing = false;
        }
    }

    // Process individual email
    async processEmail(email, seqno) {
        try {
            const from = email.from?.value?.[0];
            const senderEmail = from?.address || 'unknown@email.com';
            const senderName = from?.name || senderEmail.split('@')[0];
            const subject = email.subject || 'No Subject';
            let messageText = email.text || email.html?.replace(/<[^>]*>/g, '') || 'No message content';

            // Clean up quoted replies (remove forwarded/quoted text)
            messageText = this.cleanEmailReply(messageText);

            console.log(`\n📧 Processing email from: ${senderName} <${senderEmail}>`);
            console.log(`   Subject: ${subject}`);
            
            // Process attachments
            const attachmentInfo = [];
            if (email.attachments && email.attachments.length > 0) {
                console.log(`   📎 Found ${email.attachments.length} attachment(s)`);
                
                for (const attachment of email.attachments) {
                    try {
                        const filename = attachment.filename || `attachment_${Date.now()}`;
                        const uniqueFilename = `${Date.now()}_${filename}`;
                        const filepath = path.join(this.attachmentsDir, uniqueFilename);
                        
                        // Save attachment to disk
                        fs.writeFileSync(filepath, attachment.content);
                        
                        attachmentInfo.push({
                            filename: filename,
                            path: uniqueFilename,
                            mimetype: attachment.contentType || 'application/octet-stream',
                            size: attachment.size || attachment.content.length
                        });
                        
                        console.log(`   ✓ Saved: ${filename} (${Math.round((attachment.size || attachment.content.length) / 1024)}KB)`);
                    } catch (err) {
                        console.error(`   ✗ Error saving attachment: ${err.message}`);
                    }
                }
            }

            // Extract tracking number from subject or body
            const trackingNumber = this.extractTrackingNumber(subject, messageText);

            if (!trackingNumber) {
                console.log('⚠️  No tracking number found, skipping email');
                return;
            }

            console.log(`   Tracking: ${trackingNumber}`);

            // Find shipment by tracking number
            const shipmentResult = await this.pool.query(
                'SELECT * FROM shipments WHERE tracking_number = $1',
                [trackingNumber]
            );

            if (shipmentResult.rows.length === 0) {
                console.log(`⚠️  Shipment ${trackingNumber} not found in database`);
                return;
            }

            const shipment = shipmentResult.rows[0];

            // Determine sender type (sender or receiver)
            let senderType = 'sender';
            if (shipment.receiver_email && senderEmail.toLowerCase() === shipment.receiver_email.toLowerCase()) {
                senderType = 'receiver';
            }

            // Check if this email was already processed
            const emailId = `${senderEmail}-${subject}-${email.date}`;
            if (this.processedEmails.has(emailId)) {
                console.log('✓ Email already processed, skipping');
                return;
            }

            // Store in conversations table with attachments
            await this.pool.query(
                `INSERT INTO conversations 
                (shipment_id, tracking_number, sender_type, sender_name, sender_email, subject, message, attachments, is_read) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
                [shipment.id, trackingNumber, senderType, senderName, senderEmail, subject, messageText.substring(0, 5000), JSON.stringify(attachmentInfo)]
            );

            this.processedEmails.add(emailId);
            console.log(`✅ Customer reply saved to conversations (${senderType})`);

        } catch (error) {
            console.error('Error processing email:', error);
        }
    }

    // Extract tracking number from email
    extractTrackingNumber(subject, body) {
        // Common tracking number patterns
        const patterns = [
            /TRK[A-Z0-9]{9,15}/gi,           // TRK123456789
            /tracking[:\s]+([A-Z0-9]{9,15})/gi, // Tracking: ABC123
            /shipment[:\s]+([A-Z0-9]{9,15})/gi  // Shipment: XYZ789
        ];

        const text = `${subject} ${body}`;

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[0].replace(/tracking[:\s]+|shipment[:\s]+/gi, '').trim().toUpperCase();
            }
        }

        return null;
    }

    // Clean email reply (remove quoted text)
    cleanEmailReply(text) {
        // Remove everything after common reply markers
        const replyMarkers = [
            /On .+ wrote:/i,                    // "On Thu, Nov 27, 2025... wrote:"
            /From:.+Sent:.+To:.+Subject:/i,     // Outlook style
            /_{3,}/,                             // Horizontal lines (_____)
            /-{3,} Original Message -{3,}/i,    // "--- Original Message ---"
            />{2,}/gm,                           // Multiple quote markers (>>)
        ];

        let cleanText = text;

        for (const marker of replyMarkers) {
            const match = cleanText.search(marker);
            if (match !== -1) {
                cleanText = cleanText.substring(0, match);
            }
        }

        // Remove quoted lines (lines starting with >)
        cleanText = cleanText
            .split('\n')
            .filter(line => !line.trim().startsWith('>'))
            .join('\n');

        // Clean up extra whitespace
        cleanText = cleanText.trim();

        return cleanText || text; // Return original if cleaning resulted in empty string
    }

    // Stop email receiver
    stop() {
        if (this.imap) {
            this.imap.end();
            console.log('📭 Email receiver stopped');
        }
    }
}

module.exports = EmailReceiver;
