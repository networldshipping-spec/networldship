# 🚀 DEPLOY TO RENDER - STEP BY STEP GUIDE

## Current Status
✅ Code pushed to GitHub: https://github.com/deuarmy112/nettrack
✅ Database ready: Render PostgreSQL (Ohio)
✅ Environment variables prepared

---

## STEP 1: Create Web Service on Render

1. Go to https://render.com/dashboard
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

---

## STEP 2: Connect to GitHub Repository

1. Select **"Build and deploy from a Git repository"**
2. Click **"Connect account"** if not connected
3. Find and select: **deuarmy112/nettrack**
4. Click **"Connect"**

---

## STEP 3: Configure Web Service

**Name:** `networldship` (or `networld-shipping`)

**Region:** **Ohio (US East)** (same as your database for best performance)

**Branch:** `main`

**Root Directory:** (leave blank)

**Runtime:** `Node`

**Build Command:** 
```
npm install
```

**Start Command:**
```
node server.js
```

**Plan:** 
- **Free** (for testing) - goes to sleep after 15 min of inactivity
- **Starter $7/month** (recommended for production) - always on, custom domain

---

## STEP 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these ONE BY ONE (click "Add Environment Variable" for each):

```
NODE_ENV = production
PORT = 3000
BASE_URL = https://networldship.onrender.com
DB_USER = networld_user
DB_HOST = dpg-d4kesq49c44c73ethu30-a.ohio-postgres.render.com
DB_NAME = networld
DB_PASSWORD = bXKtUgBiwGALfWIjD0Id5OeU7kkvHJQB
DB_PORT = 5432
EMAIL_SERVICE = gmail
EMAIL_USER = networldshipping@gmail.com
EMAIL_PASS = aubo vruh sevy llfu
IMAP_HOST = imap.gmail.com
IMAP_PORT = 993
ADMIN_USERNAME = admin
ADMIN_PASSWORD = NetWorld@2025
SESSION_SECRET = networld-secure-session-key-2025-production
```

**IMPORTANT:** Use your Render URL for BASE_URL first (it will be something like `https://networldship.onrender.com`). We'll update it to `https://networldship.com` after setting up the domain.

---

## STEP 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying (takes 2-5 minutes)
3. Watch the logs in real-time
4. Wait for: **"Your service is live 🎉"**

---

## STEP 6: Test Your Deployment

Once deployed, you'll get a URL like: `https://networldship.onrender.com`

Test these pages:
- ✅ Homepage: https://networldship.onrender.com
- ✅ Admin: https://networldship.onrender.com/admin.html
- ✅ Tracking: https://networldship.onrender.com (enter tracking number)
- ✅ Login: https://networldship.onrender.com/login.html

---

## STEP 7: Connect Custom Domain (networldship.com)

### 7.1 In Render Dashboard:
1. Go to your web service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"** section
4. Click **"Add Custom Domain"**
5. Enter: `networldship.com`
6. Also add: `www.networldship.com`
7. Render will show you DNS records to add

### 7.2 In Your Domain Registrar (GoDaddy/Namecheap/etc):
1. Log in to where you bought networldship.com
2. Go to DNS settings
3. Add these records (Render will show exact values):

**For networldship.com:**
```
Type: A
Name: @
Value: [Render will provide IP address]
```

**For www.networldship.com:**
```
Type: CNAME
Name: www
Value: networldship.onrender.com
```

### 7.3 Update BASE_URL Environment Variable:
1. Go back to Render → Your Service → Environment
2. Find `BASE_URL` 
3. Change value to: `https://networldship.com`
4. Click **"Save Changes"**
5. Service will automatically redeploy

---

## STEP 8: Enable HTTPS (Automatic)

Render automatically provides free SSL certificate for your custom domain.
- After DNS propagates (5-30 minutes), HTTPS will work
- Check: https://networldship.com ✅

---

## Post-Deployment Checklist

✅ Homepage loads correctly
✅ Admin panel accessible at /admin.html
✅ Can create new shipments
✅ Tracking numbers work
✅ Email notifications sending
✅ Email receiver checking for replies
✅ All images/styles loading
✅ HTTPS working (green padlock)
✅ Custom domain working

---

## Monitoring & Logs

**View Logs:**
- Render Dashboard → Your Service → Logs tab
- See real-time server activity
- Check for errors

**Database:**
- Render Dashboard → Your Database
- Can connect via Shell for SQL queries
- Monitor connections and storage

---

## Important Notes

⚠️ **Gmail IMAP on Production:**
- May be blocked by Gmail security
- Test thoroughly
- Consider using webhook service if issues occur

⚠️ **File Uploads:**
- Currently stored on Render server
- Will be deleted on restart (ephemeral storage)
- Consider using AWS S3 or Cloudinary for production

⚠️ **Free Tier Limitations:**
- Service sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to Starter ($7/month) for always-on service

---

## Troubleshooting

**If deployment fails:**
1. Check build logs in Render
2. Verify all environment variables are set
3. Check package.json has correct scripts
4. Database connection issues? Verify DB credentials

**If site is slow:**
- Upgrade from Free to Starter plan
- Check database queries in logs
- Monitor Render metrics

**If emails not working:**
- Check Gmail App Password is correct
- Look for email errors in logs
- Gmail may block IMAP from Render IPs

---

## Render Postgres (new credentials)

Connections

Hostname
An internal hostname used by your Render services.
dpg-d6latiua2pns73bu1bk0-a

Port
5432

Database
networldship

Username
networld

Password
Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0

Internal Database URL
postgresql://networld:Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0@dpg-d6latiua2pns73bu1bk0-a/networldship


External Database URL
postgresql://networld:Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0@dpg-d6latiua2pns73bu1bk0-a.oregon-postgres.render.com/networldship

How to use these values

- On Render (recommended): Set a single environment variable for your web service named `DATABASE_URL` and paste the *Internal Database URL* as its value. Render services in the same region can connect using the internal hostname.
- Locally or from outside Render: use the *External Database URL* in your local `.env` as `DATABASE_URL` so your local app can connect.
- Alternatively (if your app expects separate vars), you can set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in Render's Environment settings using the values above.
- Do NOT commit these credentials into source control. Keep them in Render environment variables or a local `.env` excluded by `.gitignore`.

Notes

- If you change to a single `DATABASE_URL` approach, update `server.js` (or your DB initialization code) to prefer `process.env.DATABASE_URL` before falling back to individual `DB_*` variables. This keeps local and Render environments consistent.
- Internal connections (the first URL) are preferred for services running inside Render for lower latency and no external routing.
- External URL includes the public render domain and should be used only for non-Render connections.

**Setting `DATABASE_URL` on Render and locally**

- On Render (web service):
	1. Open the Render dashboard and select your Web Service for `networldship`.
 2. Go to **Settings → Environment** (or the Environment tab in the service).
 3. Click **Add Environment Variable**.
 4. Set **Key** = `DATABASE_URL` and **Value** = the *Internal Database URL* (for example: `postgresql://networld:Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0@dpg-d6latiua2pns73bu1bk0-a/networldship`).
 5. Save the variable; Render will redeploy your service and it will connect using the internal endpoint.

- Locally (development machine):
	1. Create a `.env` file in the project root (make sure `.env` is in `.gitignore`).
 2. Add either the single `DATABASE_URL` line or the individual DB variables as fallbacks. Example minimal `.env`:

```
DATABASE_URL=postgresql://networld:Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0@dpg-d6latiua2pns73bu1bk0-a/networldship
PORT=3000
BASE_URL=http://localhost:3000
```

Or if you prefer separate values:

```
DB_USER=networld
DB_HOST=dpg-d6latiua2pns73bu1bk0-a
DB_NAME=networldship
DB_PASSWORD=Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0
DB_PORT=5432
```

3. Start the server locally (`node server.js` or `npm start`) and it will read `process.env.DATABASE_URL` first.
4. Do NOT commit your `.env` to source control.

**Connecting with pgAdmin (GUI)**

- Use the *external* hostname (the internal hostname only resolves from inside Render):
	- Host: dpg-d6latiua2pns73bu1bk0-a.oregon-postgres.render.com
	- Port: 5432
	- Database: networldship
	- Username: networld
	- Password: Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0
	- SSL mode: Require

pgAdmin steps:
- Open pgAdmin, right-click **Servers** → **Create** → **Server...**
	- **General** tab: set **Name** to `networldship` (friendly name)
	- **Connection** tab:
		- Host name/address: `dpg-d6latiua2pns73bu1bk0-a.oregon-postgres.render.com`
		- Port: `5432`
		- Maintenance DB: `networldship` (or `postgres`)
		- Username: `networld`
		- Password: the Render DB password
	- **SSL** tab:
		- SSL mode: `Require`
		- Leave client cert/key/CA blank initially; set them only if Render provides them
	- Click **Save** to connect

Quick test from terminal (if `psql` is installed):

```bash
psql "postgresql://networld:Quqo3mLHlgWpuVSpFihn2vgT8Uyx0ZT0@dpg-d6latiua2pns73bu1bk0-a.oregon-postgres.render.com/networldship"
```

Notes:
- If you try to use the internal hostname from outside Render it will not resolve — always use the external domain in pgAdmin or local tools.
- If you see SSL errors, try `Prefer` then `Require` in pgAdmin's SSL mode; check the exact error message and Render's DB settings.
- Keep credentials secure; use a password manager and do not commit them to source control.


---

## Success! 🎉

Your NET WORLD SHIPPING app is now live at:
- **https://networldship.com**
- **https://www.networldship.com**

Admin panel: https://networldship.com/admin.html
Username: admin
Password: NetWorld@2025
