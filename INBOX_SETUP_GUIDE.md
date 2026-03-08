# 📧 INBOX SETUP GUIDE

## Overview
The inbox feature allows admin to view and reply to customer emails in a conversation thread format.

## Database Setup

### Step 1: Run the Migration SQL
1. Open **pgAdmin 4**
2. Connect to your **networld** database
3. Click **Tools** → **Query Tool**
4. Copy and paste the contents of `database/migrations/002_conversations_table.sql`
5. Click **Execute** (or press F5)
6. Verify success message appears

### Step 2: Verify Table Creation
Run this query to confirm:
```sql
SELECT * FROM conversations;
```

## How It Works

### 1. **Sent Emails are Logged**
   - When admin sends an email notification, it's stored in `conversations` table
   - Sender type: `admin`
   - Status: `is_read = TRUE` (admin-sent messages are auto-marked as read)

### 2. **Incoming Replies (Manual Entry for Now)**
   - Customer replies need to be manually added to the database
   - In the future, this can be automated with email webhook services (e.g., SendGrid, Mailgun)

### 3. **Viewing Conversations**
   - Click the **notification bell** icon in admin panel
   - Opens `inbox.html` with all conversation threads
   - Grouped by tracking number
   - Shows unread count badge

### 4. **Replying to Customers**
   - Select a conversation from the left panel
   - Type reply in the text area
   - Click "Send Reply"
   - Reply is stored in database (email sending to customer can be added later)

## Testing the Inbox

### Test 1: Send Email Notification
1. Go to http://localhost:3000/admin.html
2. Navigate to **Contact** section
3. Send a "Shipment Created" notification
4. This will be logged in the `conversations` table

### Test 2: Simulate Customer Reply
Run this SQL in pgAdmin to add a fake customer reply:
```sql
-- Get a shipment ID first
SELECT id, tracking_number FROM shipments LIMIT 1;

-- Insert customer reply (replace values with actual shipment data)
INSERT INTO conversations 
(shipment_id, tracking_number, sender_type, sender_name, sender_email, subject, message, is_read) 
VALUES 
(1, 'TRK123456789', 'sender', 'John Smith', 'john.smith@email.com', 'Question about delivery', 'Hi, when will my package arrive?', FALSE);
```

### Test 3: View Inbox
1. Click the **bell icon** in admin panel
2. Should see the conversation
3. Badge should show "1" unread
4. Click conversation to view messages
5. Type and send a reply

## Conversation Table Schema

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    tracking_number VARCHAR(50),
    sender_type VARCHAR(20) CHECK (sender_type IN ('admin', 'sender', 'receiver')),
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    subject VARCHAR(500),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features

✅ **Real-time Badge Counter**
   - Shows unread message count on bell icon
   - Updates every 30 seconds
   - Hides when count is 0

✅ **Conversation Threading**
   - Messages grouped by tracking number
   - Shows full conversation history
   - Latest message appears first in list

✅ **Read/Unread Status**
   - Unread conversations highlighted in yellow
   - Auto-marks as read when opened
   - Only counts customer messages as "unread"

✅ **Reply Interface**
   - Text area for typing replies
   - Stores replies in database
   - Shows in conversation thread

## Future Enhancements

### Automatic Email Reply Receiving
To automatically receive customer email replies:

1. **Option A: Email Webhook Service**
   - Use SendGrid Inbound Parse
   - Use Mailgun Routes
   - Parse incoming emails and POST to API

2. **Option B: IMAP Polling**
   - Use `node-imap` package
   - Poll Gmail inbox every minute
   - Extract replies and store in database

3. **Option C: Gmail API**
   - Use Google Gmail API with Pub/Sub
   - Get real-time notifications of new emails
   - More complex but most reliable

### Email Reply Sending
Currently replies are only stored. To send emails:

```javascript
// In the reply endpoint, add email sending:
if (emailTransporter) {
    await emailTransporter.sendMail({
        from: `NET WORLD SHIPPING <${EMAIL_CONFIG.user}>`,
        to: customerEmail,
        replyTo: EMAIL_CONFIG.user,
        subject: `Re: ${originalSubject}`,
        text: message,
        html: message
    });
}
```

## Troubleshooting

### Badge shows 0 but there are unread messages
- Check browser console for API errors
- Verify `/api/conversations/unread/count` endpoint works
- Ensure `sender_type != 'admin'` filter is working

### Conversations not appearing
- Verify `conversations` table exists in database
- Check if emails are being logged (inspect Network tab)
- Confirm email sending is working

### Can't send replies
- Check console for errors
- Verify shipment exists with that tracking number
- Ensure database connection is active

## API Endpoints

```
GET  /api/conversations                      - Get all conversations
GET  /api/conversations/:trackingNumber      - Get specific conversation thread
POST /api/conversations/:trackingNumber/read - Mark conversation as read
POST /api/conversations/reply                - Send reply to customer
GET  /api/conversations/unread/count         - Get unread count for badge
```

## Support

For issues or questions:
- Check server console logs
- Inspect browser Network tab
- Verify database queries in pgAdmin
- Check email credentials in `server.js` EMAIL_CONFIG
