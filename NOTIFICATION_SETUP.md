# Email Notification System Setup

## Overview
The admin panel now includes a Contact & Notifications section for sending email notifications to shipment senders and receivers.

## Features
✅ Search shipments by tracking number
✅ Select sender or receiver as recipient
✅ Pre-built email templates (Created, Update, Delivered)
✅ Custom message support
✅ Notification history tracking
✅ Database storage of all sent emails

## Database Setup

### Option 1: Apply Migration (if database already exists)
Run this in pgAdmin Query Tool:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX idx_notifications_tracking ON notifications(tracking_number);
CREATE INDEX idx_notifications_date ON notifications(sent_at DESC);
```

### Option 2: Fresh Database Setup
The `setup-fresh-database.sql` file now includes the notifications table automatically.

## How to Use

### 1. Access Contact Section
- Open admin panel: http://localhost:3000/admin.html
- Click "Contact" in the sidebar

### 2. Search for Shipment
- Enter tracking number in the search field
- Shipment details and sender/receiver info will appear

### 3. Select Recipient
- Click "Select" button under Sender or Receiver card
- Email field will auto-populate

### 4. Choose Email Template (Optional)
- Select from dropdown: Created, Update, or Delivered
- Message will auto-fill with professional template
- Or write custom message

### 5. Send Notification
- Review subject and message
- Click "Send Email" button
- Notification will be logged in history

## Email Templates

### Shipment Created
```
Your shipment has been created and is being processed by NET WORLD SHIPPING.
Includes: Tracking number, origin, destination, tracking link
```

### Status Update
```
Your shipment status has been updated.
Includes: Current status, current location, tracking link
```

### Delivered
```
Great news! Your shipment has been successfully delivered!
Includes: Delivery confirmation, origin, destination
```

## Company Information
- Company Name: NET WORLD SHIPPING
- Company Email: support@networldshipping.com
- Phone: +1 (555) 123-4567

## API Endpoints

### Send Email Notification
```
POST /api/notifications/send
Body: {
  shipment_id: number,
  tracking_number: string,
  recipient_type: 'sender' | 'receiver',
  recipient_email: string,
  subject: string,
  message: string
}
```

### Get All Notifications
```
GET /api/notifications
Returns: Last 100 notifications ordered by date
```

### Get Shipment Notifications
```
GET /api/notifications/shipment/:shipmentId
Returns: All notifications for specific shipment
```

## Email Integration (Future Enhancement)

Currently, the system simulates email sending and stores notifications in the database. To enable actual email sending, integrate with:

### Option 1: Nodemailer with Gmail
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'support@networldshipping.com',
        pass: 'your-app-password'
    }
});
```

### Option 2: SendGrid
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Option 3: AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });
```

## Notification History
- View all sent notifications in the table
- Filter by: Date, Tracking Number, Recipient Type
- Shows: Timestamp, Tracking, Recipient Email, Type, Subject, Status

## Automatic Notifications (Future Enhancement)

You can trigger automatic notifications on:
- Shipment creation
- Status updates
- Delivery confirmation
- Estimated delivery date changes

Add to `handleCreateShipment()` function:
```javascript
// After shipment creation
await sendAutoNotification(shipmentId, 'created', 'sender');
await sendAutoNotification(shipmentId, 'created', 'receiver');
```

## Notes
- Email addresses must be present in sender/receiver data
- All notifications are stored permanently in database
- Notification history shows last 100 entries
- LocalStorage fallback for offline mode
