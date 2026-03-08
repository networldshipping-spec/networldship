# 🚀 New Laptop Setup Guide - NetWorld Shipping Project

## 📋 Overview
Complete guide to set up the NetWorld Shipping application on your new laptop and continue development.

---

## ✅ Step 1: Install Required Software

### 1.1 Node.js (Required)
- **Download:** https://nodejs.org/
- **Version:** LTS (v18 or higher)
- **Install:** Run installer with default settings
- **Verify:** Open PowerShell and run:
  ```powershell
  node --version
  npm --version
  ```

### 1.2 PostgreSQL with pgAdmin 4 (Required)
- **Download:** https://www.postgresql.org/download/windows/
- **Version:** Latest (PostgreSQL 15+)
- **During Installation:**
  - Set password for `postgres` user (remember this!)
  - Port: `5432` (default)
  - Install pgAdmin 4 (check the box)
- **Verify:** Open pgAdmin 4, should connect to localhost

### 1.3 Git & GitHub Desktop (Required)
- **Git:** https://git-scm.com/download/win
  - Install with default settings
- **GitHub Desktop:** https://desktop.github.com/
  - Install and sign in with: `deuarmy112`
- **Verify Git:**
  ```powershell
  git --version
  ```

### 1.4 VS Code (Recommended)
- **Download:** https://code.visualstudio.com/
- **Extensions to Install:**
  - ESLint
  - Prettier
  - PostgreSQL
  - GitHub Copilot (if you have it)

---

## 📥 Step 2: Clone Your Project

### 2.1 Using GitHub Desktop (Easiest)
1. Open **GitHub Desktop**
2. Sign in with your GitHub account: `deuarmy112`
3. Click **File** → **Clone Repository**
4. Select **`deuarmy112/nettrack`**
5. Choose location: `C:\Users\[YourName]\Desktop\nettrack`
6. Click **Clone**

### 2.2 Using Command Line (Alternative)
```powershell
cd C:\Users\[YourName]\Desktop
git clone https://github.com/deuarmy112/nettrack.git
cd nettrack
```

---

## 🗄️ Step 3: Set Up Local Database

### 3.1 Create Database
1. Open **pgAdmin 4**
2. Expand **Servers** → **PostgreSQL** → Right-click **Databases**
3. Select **Create** → **Database**
4. **Name:** `networld`
5. **Owner:** `postgres`
6. Click **Save**

### 3.2 Run Database Schema
1. Right-click on **networld** database
2. Select **Query Tool**
3. Open file: `render-schema.sql` from your project
4. Copy all content and paste into Query Tool
5. Click **Execute (F5)**
6. You should see: "Query returned successfully"

### 3.3 Add Missing Columns
1. In the same Query Tool, run:
```sql
-- Add package image columns
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_image_path VARCHAR(500);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_image_filename VARCHAR(255);

-- Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'shipments' ORDER BY ordinal_position;
```

### 3.4 Verify Tables Created
Run this query:
```sql
\dt
```
You should see:
- `shipments`
- `tracking_events`
- `notifications`
- `conversations`

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Create .env File
Your project already has `.env` file, but update the database password:

1. Open project in VS Code
2. Open `.env` file
3. Update this line with your NEW PostgreSQL password:
```env
DB_PASSWORD=YOUR_NEW_POSTGRES_PASSWORD
```

### 4.2 Complete .env Configuration
Verify all these values are correct:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=networld
DB_PASSWORD=YOUR_NEW_POSTGRES_PASSWORD
DB_PORT=5432

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=networldshipping@gmail.com
EMAIL_PASS=aubo vruh sevy llfu

# IMAP Configuration (Gmail)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=NetWorld@2025
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

---

## 📦 Step 5: Install Dependencies

Open VS Code terminal (Ctrl + `) and run:

```powershell
npm install
```

This will install all required packages:
- express
- pg (PostgreSQL)
- nodemailer
- node-imap
- multer
- bcrypt
- express-session
- cors
- dotenv
- and more...

Wait for completion (may take 2-3 minutes).

---

## 🚀 Step 6: Start the Server

### 6.1 Run the Application
In VS Code terminal:
```powershell
node server.js
```

### 6.2 Expected Output
You should see:
```
📧 Email service configured
   User: networldshipping@gmail.com
📬 Email receiver initialized - checking for customer replies every 2 minutes
🚀 Server running on http://localhost:3000
📊 API endpoints available at http://localhost:3000/api/
✅ Successfully connected to PostgreSQL database: networld
📬 Email receiver connected to Gmail IMAP
```

### 6.3 Test the Application
Open browser and visit:
- **Public Page:** http://localhost:3000
- **Admin Login:** http://localhost:3000/login.html
  - Username: `admin`
  - Password: `NetWorld@2025`
- **Admin Panel:** http://localhost:3000/admin.html (after login)

---

## 🌐 Production Deployment (Already Set Up)

Your app is already deployed at:
- **Live URL:** https://net-world-shipping.onrender.com
- **Render Dashboard:** https://dashboard.render.com

### Production Database Credentials
- **Service:** Render PostgreSQL
- **Database:** networld
- **Region:** Ohio (US East)
- **Internal Host:** dpg-d4kesq49c44c73ethu30-a
- **External Host:** dpg-d4kesq49c44c73ethu30-a.ohio-postgres.render.com
- **Port:** 5432
- **Username:** networld_user
- **Password:** bXKtUgBiwGALfWIjD0Id5OeU7kkvHJQB

Full credentials saved in: `RENDER_DATABASE_CREDENTIALS.md`

---

## 📝 Important Files in Your Project

### Configuration Files
- `.env` - Local development environment variables
- `.env.example` - Template for environment variables
- `.gitignore` - Files excluded from Git (includes .env)
- `package.json` - Project dependencies and scripts

### Database Files
- `render-schema.sql` - Production database schema
- `database-setup.sql` - Original setup with sample data
- `add-missing-column.sql` - Column fixes
- `check-table-structure.sql` - Database verification queries

### Deployment Guides
- `RENDER_DEPLOYMENT_GUIDE.md` - Complete Render deployment steps
- `RENDER_DATABASE_CREDENTIALS.md` - Production database credentials
- `GITHUB_DESKTOP_GUIDE.md` - How to use GitHub Desktop
- `DEPLOYMENT_GUIDE.md` - General hosting platform comparison

### Core Application Files
- `server.js` - Main backend server (Express.js)
- `emailReceiver.js` - IMAP email receiving service
- `index.html` - Public tracking page
- `admin.html` - Admin dashboard
- `login.html` - Admin login page
- `inbox.html` - Admin-customer conversation interface
- `admin-script.js` - Admin panel frontend logic
- `script.js` - Public page frontend logic
- `styles.css` - Application styling

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
- Check PostgreSQL is running (search "Services" in Windows, find "postgresql-x64-15")
- Verify password in `.env` matches your PostgreSQL password
- Test connection in pgAdmin 4

### Issue 2: "Port 3000 already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port in .env
PORT=3001
```

### Issue 3: "Module not found"
**Solution:**
```powershell
# Delete node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

### Issue 4: "Email not sending"
**Expected Behavior:**
- **Local Development:** Emails work with Gmail SMTP
- **Render Free Tier:** SMTP blocked, emails are simulated
- **Solution:** Upgrade to Render paid tier or use SendGrid/Mailgun API

### Issue 5: Database column errors
**Solution:**
Run the SQL from `add-missing-column.sql` in pgAdmin 4

---

## 📊 Project Status

### ✅ Working Features
- ✅ Admin authentication (login/logout)
- ✅ Create shipments with full details
- ✅ Track shipments publicly
- ✅ Upload receipts and attachments
- ✅ Admin-customer conversations/inbox
- ✅ Mobile responsive design
- ✅ Database operations (PostgreSQL)
- ✅ Email sending (local) / simulated (production free tier)
- ✅ File upload system
- ✅ Session management
- ✅ GitHub version control
- ✅ Production deployment on Render

### ⏳ Pending (Requires Paid Tier)
- ⏳ Real email sending on Render (SMTP blocked on free tier)
- ⏳ IMAP email receiving on Render
- ⏳ Custom domain setup

### 🎯 Next Steps
1. Set up development environment on new laptop ✓
2. Test all features locally ✓
3. Push any pending changes to GitHub
4. Consider upgrading Render to paid tier for email functionality
5. Purchase and configure custom domain (optional)
6. Set up monitoring and backups

---

## 🔐 Important Credentials

### Local Database
- **Username:** postgres
- **Password:** [Your PostgreSQL password]
- **Database:** networld
- **Port:** 5432

### Production Database (Render)
- See `RENDER_DATABASE_CREDENTIALS.md` for complete details

### Admin Login
- **Username:** admin
- **Password:** NetWorld@2025

### Email Account
- **Gmail:** networldshipping@gmail.com
- **App Password:** aubo vruh sevy llfu

### GitHub
- **Repository:** https://github.com/deuarmy112/nettrack
- **Account:** deuarmy112

---

## 📚 Useful Commands

### Git Commands
```powershell
# Check status
git status

# Pull latest changes
git pull origin main

# See commit history
git log --oneline
```

### Database Commands (psql)
```powershell
# Connect to database
psql -U postgres -d networld

# List tables
\dt

# Describe table
\d shipments

# Exit
\q
```

### Node.js Commands
```powershell
# Start server
node server.js

# Start with auto-reload (if nodemon installed)
npm run dev

# Check installed packages
npm list

# Update packages
npm update
```

---

## 🆘 Getting Help

### Documentation Links
- **Node.js:** https://nodejs.org/docs/
- **Express.js:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Render:** https://render.com/docs
- **Nodemailer:** https://nodemailer.com/
- **GitHub Desktop:** https://docs.github.com/desktop

### Project Repository
- **Issues:** https://github.com/deuarmy112/nettrack/issues
- **Code:** https://github.com/deuarmy112/nettrack

---

## ✅ Setup Checklist

Use this to track your setup progress:

- [ ] Node.js installed and verified
- [ ] PostgreSQL installed and running
- [ ] pgAdmin 4 accessible
- [ ] Git installed
- [ ] GitHub Desktop installed and signed in
- [ ] VS Code installed
- [ ] Project cloned from GitHub
- [ ] Database `networld` created
- [ ] Database schema executed
- [ ] Missing columns added
- [ ] `.env` file updated with new password
- [ ] Dependencies installed (`npm install`)
- [ ] Server started successfully
- [ ] Can access http://localhost:3000
- [ ] Can login to admin panel
- [ ] Can create test shipment
- [ ] All features tested locally

---

## 🎉 You're All Set!

Once you complete all steps above, your development environment is ready!

**Start developing:**
```powershell
cd C:\Users\[YourName]\Desktop\nettrack
code .
node server.js
```

**Make changes and push to GitHub:**
1. Make your code changes in VS Code
2. Open GitHub Desktop
3. Review changes
4. Write commit message
5. Click "Commit to main"
6. Click "Push origin"
7. Render automatically redeploys!

---

**Last Updated:** November 29, 2025
**Project:** NetWorld Shipping Tracking System
**Developer:** deuarmy112
**Production:** https://net-world-shipping.onrender.com
