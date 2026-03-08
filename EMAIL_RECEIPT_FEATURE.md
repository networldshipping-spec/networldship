# Email Notifications with Receipt Feature

## Overview
The email notification system now automatically includes a professional HTML receipt when sending notifications to senders or receivers. This provides customers with a complete record of their shipment details in every email.

## What's Included in the Email

### Email Structure
1. **Personalized Message** - Your custom or template-based message
2. **Professional Receipt** - Fully formatted HTML receipt with:
   - Company header with NET WORLD SHIPPING branding
   - Sender and receiver contact information
   - Complete shipment details
   - Itemized cost breakdown
   - Total shipping costs with tax
   - Tracking link for easy access

## Features

### ✅ Automatic Receipt Generation
- Receipt is automatically generated when you send any notification
- No extra steps required - just send the email as usual
- Receipt matches the printed version from the Receipts section

### 📧 Email Templates Updated
All three email templates now mention the attached receipt:

1. **Shipment Created** - "SHIPMENT RECEIPT ATTACHED - Please see the attached receipt for complete shipment details..."
2. **Status Update** - "SHIPMENT RECEIPT ATTACHED - An updated receipt with current shipment information is attached..."
3. **Delivered** - Standard delivery confirmation (can add receipt if needed)

### 🎨 Professional HTML Receipt Includes:
- NET WORLD SHIPPING branded header
- Receipt date
- Complete sender information (name, email, phone, address, city, country)
- Complete receiver information (name, email, phone, address, city, country)
- Shipment details table:
  - Tracking number
  - Carrier
  - Service type with cost
  - Package details (weight, dimensions, description)
  - Insurance coverage
  - Handling fees
- Cost breakdown:
  - Subtotal
  - Tax (10%)
  - Total amount
- Shipment status and route information
- Direct tracking link
- Professional footer with company information

## How to Use

### Sending Email with Receipt (Admin Panel)

1. **Navigate to Contact Section**
   - Open admin panel
   - Click "Contact" in sidebar

2. **Search for Shipment**
   - Enter tracking number
   - Shipment details will load

3. **Select Recipient**
   - Choose Sender or Receiver
   - Email address auto-fills

4. **Choose Template or Write Message**
   - Select a template (recommended) or write custom message
   - Template messages already mention the receipt

5. **Notice the Receipt Indicator**
   - Blue box shows: "Receipt Included"
   - Confirms receipt will be attached

6. **Send Email**
   - Click "Send Email with Receipt"
   - Email with receipt is sent and logged

## Technical Details

### Receipt Generation Function
```javascript
generateReceiptForEmail(shipment)
```
- Creates standalone HTML receipt
- Inline CSS styling (email-safe)
- All information from shipment object
- Responsive design for email clients

### Data Sent to Backend
```javascript
{
    shipment_id: number,
    recipient_type: 'sender' | 'receiver',
    recipient_email: string,
    subject: string,
    message: string,
    tracking_number: string,
    receipt_html: string,        // NEW: Full HTML receipt
    shipment_data: object         // NEW: Complete shipment data
}
```

### Email HTML Structure
```html
<div>
    <!-- Message Section -->
    <div style="white-space: pre-line; padding: 20px; background: #f8fafc;">
        {Your message here}
    </div>
    
    <!-- Receipt Section -->
    {Complete HTML receipt with all styling}
</div>
```

## Email Service Integration

### Current Status
The system currently **simulates** email sending and logs details to console. The receipt HTML is generated and ready to send.

### To Enable Real Email Sending

#### Option 1: Nodemailer with Gmail
```javascript
npm install nodemailer

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'support@networldshipping.com',
        pass: 'your-app-password'
    }
});

const mailOptions = {
    from: 'NET WORLD SHIPPING <support@networldshipping.com>',
    to: recipient_email,
    subject: subject,
    text: message,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="white-space: pre-line; padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
                ${message}
            </div>
            ${receipt_html}
        </div>
    `
};

await transporter.sendMail(mailOptions);
```

#### Option 2: SendGrid
```javascript
npm install @sendgrid/mail

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: recipient_email,
    from: 'support@networldshipping.com',
    subject: subject,
    text: message,
    html: `<div>${message}</div>${receipt_html}`
};

await sgMail.send(msg);
```

#### Option 3: AWS SES
```javascript
npm install aws-sdk

const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

const params = {
    Destination: { ToAddresses: [recipient_email] },
    Message: {
        Body: { Html: { Data: `<div>${message}</div>${receipt_html}` } },
        Subject: { Data: subject }
    },
    Source: 'support@networldshipping.com'
};

await ses.sendEmail(params).promise();
```

## Benefits

### For Customers
- ✅ Complete shipment record in email
- ✅ Professional, branded receipt
- ✅ All contact information readily available
- ✅ Easy reference for tracking
- ✅ Can print or save for records

### For Business
- ✅ Professional communication
- ✅ Reduced support inquiries (all info included)
- ✅ Branded customer touchpoint
- ✅ Consistent documentation
- ✅ Automated process - no manual work

## Console Output

When email is sent, you'll see:
```
📧 Email notification with receipt sent to customer@example.com
Subject: NET WORLD SHIPPING - Shipment Update TRK123456789
Tracking: TRK123456789
Receipt included: Yes
Shipment details: Included
```

## Testing

### Test the Receipt
1. Send test notification to your own email
2. Check spam/junk folder if not received
3. Verify receipt displays correctly
4. Test on different email clients:
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile devices

### Verify Receipt Content
- All sender/receiver details present
- Costs calculated correctly
- Tracking link works
- Professional formatting maintained
- Company branding visible

## Customization

### Modify Receipt Design
Edit `generateReceiptForEmail()` function in `admin-script.js`:
- Change colors in `<style>` section
- Modify layout structure
- Add/remove information fields
- Adjust cost calculations
- Update company information

### Modify Email Templates
Edit `applyEmailTemplate()` function to change:
- Message wording
- Receipt mention text
- Contact information
- Tracking URL format

## Important Notes

1. **Receipt Always Included** - Every notification sent from Contact section includes receipt
2. **Real-time Generation** - Receipt generated at send time with current data
3. **Email-Safe HTML** - Receipt uses inline CSS for maximum compatibility
4. **No File Attachments** - Receipt is embedded HTML (not PDF attachment)
5. **Database Storage** - Only message text stored, not full receipt HTML (to save space)

## Future Enhancements

Possible additions:
- [ ] PDF receipt attachment option
- [ ] Multiple language support
- [ ] Receipt customization per shipment type
- [ ] Customer preference for receipt format
- [ ] Automatic receipts on status changes
- [ ] Receipt preview before sending
- [ ] Custom branding per customer

## Troubleshooting

### Receipt not showing in email
- Check email client (some block HTML emails)
- Verify receipt_html is generated (check console)
- Test with different email service

### Receipt formatting issues
- Email clients have varying HTML support
- Use tables for layout (better email compatibility)
- Avoid complex CSS (use inline styles)
- Test across different clients

### Missing shipment data
- Ensure currentShipmentForContact has all fields
- Check database for complete sender/receiver info
- Verify parseFloat conversions for costs

## Support

For issues or questions:
- Check console logs for errors
- Verify database has complete shipment data
- Test with different shipments
- Review email service configuration
