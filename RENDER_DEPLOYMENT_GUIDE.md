# Render.com Deployment Guide - Step by Step

## 🚀 Deploy NET WORLD SHIPPING to Render.com

### Prerequisites
✅ GitHub repository created: https://github.com/deuarmy112/nettrack
✅ Code pushed to GitHub
✅ Render account (we'll create one)

---

## Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Choose **"Sign in with GitHub"** (easiest option)
4. Authorize Render to access your GitHub account
5. Complete your profile if asked

---

## Step 2: Create PostgreSQL Database

### 2.1 Navigate to Databases
1. From Render dashboard, click **"New +"** button (top right)
2. Select **"PostgreSQL"**

### 2.2 Configure Database
Fill in these details:

**Name:** `networld-db`

**Database:** `networld` (this is the database name inside PostgreSQL)

**User:** `networld_user` (or leave default)

**Region:** Choose closest to you:
- Oregon (US-West)
- Ohio (US-East)
- Frankfurt (Europe)
- Singapore (Asia)

**PostgreSQL Version:** `16` (latest)

**Plan:** Select **"Free"** plan
- 90 days free trial
- Then $7/month for hobby plan
- 1GB storage
- 100 connection limit

### 2.3 Create Database
1. Click **"Create Database"**
2. Wait 2-3 minutes for database to provision
3. Database status will change to **"Available"**

### 2.4 Save Database Credentials
Once created, scroll down to **"Connections"** section and save these:

```
Internal Database URL: (starts with postgres://...)
External Database URL: (starts with postgres://...)
PSQL Command: (for direct connection)

Individual credentials:
Hostname: 
Port: 
Database: networld
Username: 
Password: 
```

**IMPORTANT:** Keep these credentials safe! You'll need them.

---

## Step 3: Set Up Database Schema

### Option A: Using Render Web Console (Easiest)

1. On your database page, scroll down to **"Shell"** section
2. Click **"Connect"** button
3. A terminal will open with `psql` prompt
4. Copy and paste your entire database schema from `database-setup.sql`
5. Or run these commands one by one:

```sql
-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50),
    sender_address TEXT,
    receiver_name VARCHAR(255) NOT NULL,
    receiver_email VARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(50),
    receiver_address TEXT,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    carrier VARCHAR(100),
    package_weight VARCHAR(50),
    package_dimensions VARCHAR(100),
    package_type VARCHAR(100),
    package_quantity INTEGER DEFAULT 1,
    shipment_cost DECIMAL(10, 2),
    package_image VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    estimated_delivery DATE,
    actual_delivery DATE,
    current_location VARCHAR(255),
    receipt_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    subject TEXT,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    subject TEXT,
    message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_tracking ON notifications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_conversations_tracking ON conversations(tracking_number);
CREATE INDEX IF NOT EXISTS idx_conversations_read ON conversations(is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_attachments ON conversations USING gin(attachments);
```

6. Press Enter after each command
7. You should see `CREATE TABLE` confirmations

### Option B: Using Local psql (If you prefer)

```bash
# Use the External Database URL from Render
psql "YOUR_EXTERNAL_DATABASE_URL_HERE" -f database-setup.sql
```

---

## Step 4: Create Web Service

### 4.1 Start New Service
1. From Render dashboard, click **"New +"** (top right)
2. Select **"Web Service"**

### 4.2 Connect Repository
1. If this is your first time, click **"Connect account"** to link GitHub
2. You'll see your GitHub repositories
3. Find and click **"Connect"** next to **"deuarmy112/nettrack"**

### 4.3 Configure Web Service

Fill in these settings:

**Name:** `networld-shipping`
(This will be your app URL: networld-shipping.onrender.com)

**Region:** Same as your database (e.g., Oregon)

**Branch:** `main`

**Root Directory:** Leave empty

**Runtime:** **Node**

**Build Command:**
```
npm install
```

**Start Command:**
```
node server.js
```

**Plan:** Select **"Free"**
- Free tier available
- Spins down after 15 min of inactivity
- 750 hours/month free

---

## Step 5: Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

Click **"Add Environment Variable"** for each:

### Required Variables:

**1. NODE_ENV**
```
production
```

**2. PORT**
```
3000
```

**3. BASE_URL**
```
https://networld-shipping.onrender.com
```
(Replace with your actual Render URL)

**4. DB_USER**
```
(Your database username from Step 2.4)
```

**5. DB_HOST**
```
(Your database hostname from Step 2.4)
```

**6. DB_NAME**
```
networld
```

**7. DB_PASSWORD**
```
(Your database password from Step 2.4)
```

**8. DB_PORT**
```
5432
```

**9. EMAIL_SERVICE**
```
gmail
```

**10. EMAIL_USER**
```
networldshipping@gmail.com
```

**11. EMAIL_PASS**
```
aubo vruh sevy llfu
```
(Your Gmail app password)

**12. IMAP_HOST**
```
imap.gmail.com
```

**13. IMAP_PORT**
```
993
```

**14. ADMIN_USERNAME**
```
admin
```

**15. ADMIN_PASSWORD**
```
NetWorld@2025
```
(Or choose your own secure password)

**16. SESSION_SECRET**
```
your-super-secret-random-key-change-this
```
(Generate a random string)

### To generate a secure session secret:
Use online: https://www.random.org/strings/
Or PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## Step 6: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Render will start building your app
3. Watch the logs in real-time (very cool!)
4. First deploy takes 2-5 minutes

### What Happens:
1. ✅ Clones your GitHub repository
2. ✅ Runs `npm install`
3. ✅ Starts `node server.js`
4. ✅ Shows logs in real-time

### Success Indicators:
You'll see in logs:
```
📧 Email service configured
📬 Email receiver initialized
🚀 Server running on http://localhost:3000
✅ Successfully connected to PostgreSQL database: networld
```

---

## Step 7: Test Your Deployed App

### 7.1 Get Your URL
At the top of your service page, you'll see:
```
https://networld-shipping.onrender.com
```

### 7.2 Test Public Tracking Page
1. Click the URL or copy and paste in browser
2. You should see your tracking page
3. Test tracking with a tracking number (if you added sample data)

### 7.3 Test Admin Panel
1. Go to: `https://networld-shipping.onrender.com/admin.html`
2. You should be redirected to login page
3. Login with:
   - Username: `admin`
   - Password: `NetWorld@2025` (or what you set)
4. Test creating a shipment
5. Test sending notifications

### 7.4 Test Email
1. Create a shipment with real email address
2. Send notification
3. Check if email is received

---

## Step 8: Custom Domain (Optional)

Want your own domain like `tracking.yourcompany.com`?

1. Buy a domain from Namecheap, GoDaddy, etc.
2. In Render, go to your service → **Settings** → **Custom Domains**
3. Click **"Add Custom Domain"**
4. Enter your domain
5. Follow DNS instructions to point domain to Render
6. Wait for SSL certificate (automatic, takes ~1 hour)

---

## Troubleshooting

### "Database connection failed"
- ✅ Check environment variables are correct
- ✅ Use INTERNAL Database URL (not external) for Render
- ✅ Database must be in same region as web service

### "Port already in use"
- ✅ Don't set PORT in environment (Render sets it automatically)
- ✅ Or set to `process.env.PORT || 3000` in code

### "Module not found"
- ✅ Check package.json includes all dependencies
- ✅ Run build again: Service → **Manual Deploy** → **Deploy latest commit**

### "Application Error"
- ✅ Check logs in Render dashboard
- ✅ Look for red error messages
- ✅ Verify all environment variables are set

### "Spins down after inactivity"
- Free tier limitation
- Upgrade to $7/month Hobby plan for always-on
- Or use a service to ping your app every 10 minutes

---

## Maintenance & Updates

### Update Your App:
1. Make changes in VS Code
2. Commit in GitHub Desktop
3. Push to GitHub
4. Render automatically detects and deploys! 🚀

### Turn off auto-deploy:
Service → Settings → Auto-Deploy → Toggle off

### Manual deploy:
Service → Manual Deploy → Deploy latest commit

### View Logs:
Service → Logs (real-time)

### Backup Database:
Database → Snapshots → Create Snapshot

---

## Monitoring

### Health Check:
Render automatically pings: `/` or `/health`

### Check Status:
```
https://networld-shipping.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "connected"
}
```

---

## Costs

### Free Tier:
- ✅ 750 hours/month web service
- ✅ 90 days free PostgreSQL database
- ✅ SSL certificate included
- ✅ Unlimited deploys
- ⚠️ Spins down after 15 min inactivity

### After 90 Days (Recommended):
- 💰 Web Service: FREE (750hrs/month)
- 💰 PostgreSQL: $7/month (Hobby plan)
- **Total: ~$7/month**

### For Production (Optional):
- 💰 Web Service: $7/month (Starter - always on)
- 💰 PostgreSQL: $7/month (Hobby)
- **Total: $14/month**

---

## 🎉 Success!

Your app is now live at:
```
https://networld-shipping.onrender.com
```

Share it with the world! 🌍

### What You Have:
✅ Production-grade hosting
✅ SSL/HTTPS encryption
✅ PostgreSQL database
✅ Automatic deployments from GitHub
✅ Real-time logs
✅ Email notifications working
✅ File uploads working
✅ Admin authentication
✅ Mobile responsive

### Next Steps:
- 📱 Test on mobile devices
- 📧 Test email notifications thoroughly
- 👥 Invite users to test
- 📊 Monitor usage and logs
- 🔧 Fix any issues that arise
- ⭐ Get feedback and improve

Congratulations! 🎊
