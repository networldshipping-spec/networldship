# Email Configuration Guide for NET WORLD SHIPPING

## ✅ Nodemailer Installed

The system is now configured to send **real emails** to senders and receivers. Follow the steps below to enable it.

## 📧 Email Service Setup

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable it if not already enabled

2. **Generate App Password**
   - Google Account → Security
   - Under "2-Step Verification" section
   - Scroll to "App passwords"
   - Select app: "Mail"
   - Select device: "Windows Computer" (or Other)
   - Click "Generate"
   - **Copy the 16-character password** (no spaces)

3. **Update server.js**
   ```javascript
   const EMAIL_CONFIG = {
       service: 'gmail',
       user: 'your-email@gmail.com',      // Your Gmail address
       pass: 'xxxx xxxx xxxx xxxx'        // 16-character app password
   };
   ```

### Option 2: Outlook/Hotmail

1. **Update server.js**
   ```javascript
   const EMAIL_CONFIG = {
       service: 'outlook',
       user: 'your-email@outlook.com',
       pass: 'your-password'
   };
   ```

### Option 3: Custom SMTP Server

1. **Update server.js**
   ```javascript
   // Replace the EMAIL_CONFIG and transporter code with:
   const emailTransporter = nodemailer.createTransport({
       host: 'smtp.your-domain.com',
       port: 587,
       secure: false,
       auth: {
           user: 'your-email@your-domain.com',
           pass: 'your-password'
       }
   });
   ```

## 🔧 Configuration Steps

### 1. Open server.js

Find this section (around line 12):

```javascript
const EMAIL_CONFIG = {
    service: 'gmail',
    user: 'your-email@gmail.com',     // ← REPLACE THIS
    pass: 'your-app-password'          // ← REPLACE THIS
};
```

### 2. Replace with Your Credentials

```javascript
const EMAIL_CONFIG = {
    service: 'gmail',
    user: 'networldshipping@gmail.com',    // Your actual email
    pass: 'abcd efgh ijkl mnop'             // Your app password
};
```

### 3. Restart the Server

```powershell
npm start
```

You should see:
```
📧 Email service configured
🚀 Server running on http://localhost:3000
```

## 📨 Testing Email Sending

### 1. Access Admin Panel
- Go to: http://localhost:3000/admin.html
- Navigate to "Contact" section

### 2. Search for Shipment
- Enter tracking number: `TRK123456789`
- Shipment details will load

### 3. Select Recipient
- Click "Select" under Sender or Receiver
- Email address will auto-fill

### 4. Choose Template
- Select "Shipment Created" (includes receipt)
- Or "Status Update" (no receipt)

### 5. Send Email
- Click "Send Email" button
- Check console for confirmation
- Recipient will receive the email!

## ✅ Confirmation Messages

### Success:
```
✅ Email sent successfully to john.smith@email.com
Subject: NET WORLD SHIPPING - Shipment Update TRK123456789
Tracking: TRK123456789
Receipt included: Yes (Shipment Creation)
```

### Not Configured:
```
📧 Email simulation - notification logged to database
⚠️  Configure email credentials in server.js to send real emails
```

### Error:
```
❌ Error sending email: Invalid login: 535-5.7.8 Username and Password not accepted
```

## 🚨 Troubleshooting

### Error: "Invalid login"
**Solution:** 
- Use App Password, not regular password
- Enable 2-Factor Authentication first
- Generate new App Password

### Error: "Authentication failed"
**Solution:**
- Check email and password are correct
- Remove spaces from App Password
- Try different email service

### Error: "Connection timeout"
**Solution:**
- Check internet connection
- Try different SMTP port (465, 587)
- Disable antivirus/firewall temporarily

### Error: "Less secure app access"
**Solution:**
- Gmail no longer supports this
- Must use App Password with 2FA

## 📝 Email Format

### With Receipt (Shipment Created):
```
[Personalized Message]
━━━━━━━━━━━━━━━━━━━
[Professional HTML Receipt]
- Company branding
- Sender/Receiver details
- Package information
- Cost breakdown
- Tracking link
```

### Without Receipt (Updates):
```
[Personalized Message]
- Status update
- Current location
- Tracking link
```

## 🔐 Security Best Practices

1. **Never commit credentials to GitHub**
   - Use environment variables in production
   - Keep passwords in `.env` file (already in .gitignore)

2. **Use App Passwords**
   - More secure than regular passwords
   - Can be revoked individually

3. **Limit access**
   - Only authorized admins can send emails
   - All emails logged in database

## 📊 Email Logs

All sent emails are stored in the `notifications` table:

```sql
SELECT * FROM notifications 
ORDER BY sent_at DESC 
LIMIT 10;
```

View in admin panel: Contact → Notification History

## 🌐 Production Deployment

For production, use environment variables:

### 1. Create .env file:
```
EMAIL_SERVICE=gmail
EMAIL_USER=support@networldshipping.com
EMAIL_PASS=your-app-password
```

### 2. Update server.js:
```javascript
require('dotenv').config();

const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
};
```

### 3. Install dotenv:
```powershell
npm install dotenv
```

## 📧 Supported Email Services

Nodemailer supports 30+ services:
- Gmail
- Outlook / Office365
- Yahoo
- iCloud
- SendGrid
- Mailgun
- Amazon SES
- Custom SMTP

See full list: https://nodemailer.com/smtp/well-known/

## 🎯 Current Status

✅ Nodemailer installed
✅ Email configuration added to server.js
✅ Receipt generation working
✅ Database logging working
⚠️  **Waiting for email credentials**

## Next Steps

1. Get your Gmail App Password
2. Update EMAIL_CONFIG in server.js
3. Restart server
4. Test sending an email
5. Check recipient's inbox (and spam folder)

**Ready to send real emails!** 🚀
