# GitHub Setup & Push Guide

## Step 1: Restart VS Code (Important!)
After installing Git, you **MUST restart VS Code** for Git to be recognized in the terminal.

1. Close VS Code completely
2. Reopen VS Code
3. Open the terminal (Ctrl + `)

## Step 2: Configure Git (First Time Only)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## Step 3: Create GitHub Repository
1. Go to https://github.com
2. Click the **"+"** icon (top right) → **New repository**
3. Repository name: `networld-shipping-tracker`
4. Description: `Complete shipment tracking system with admin panel and email notifications`
5. Keep it **Private** (recommended) or Public
6. **DO NOT** initialize with README, .gitignore, or license
7. Click **Create repository**

## Step 4: Initialize Local Git Repository
Run these commands in VS Code terminal (in project folder):

```powershell
# Initialize Git repository
git init

# Add all files (except those in .gitignore)
git add .

# Create first commit
git commit -m "Initial commit - Complete shipment tracking system with authentication and file attachments"

# Rename branch to main (if needed)
git branch -M main

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/networld-shipping-tracker.git

# Push to GitHub
git push -u origin main
```

## Step 5: Verify .gitignore
Make sure `.gitignore` file exists and contains:
```
node_modules/
.env
uploads/
*.log
.DS_Store
```

## Step 6: Authentication
When pushing, you'll be prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use **Personal Access Token** (NOT your GitHub password)

### To create Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Name: `VS Code Git Access`
4. Expiration: 90 days (or custom)
5. Select scopes: **repo** (all checkboxes under it)
6. Click Generate token
7. **COPY THE TOKEN** (you won't see it again!)
8. Use this token as password when pushing

## Complete Command Sequence (Copy & Paste)
```powershell
# Configure Git (replace with your info)
git config --global user.name "John Doe"
git config --global user.email "john@example.com"

# Initialize and commit
git init
git add .
git commit -m "Initial commit - Complete shipment tracking system"
git branch -M main

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/networld-shipping-tracker.git

# Push to GitHub
git push -u origin main
```

## Troubleshooting

### "git is not recognized"
- **Solution**: Restart VS Code after installing Git
- Check if Git is installed: Open Command Prompt and type `git --version`
- If still not working, add Git to PATH manually:
  - Git is usually installed at: `C:\Program Files\Git\cmd`
  - Add to System PATH environment variable

### "Repository not found"
- Check the repository URL is correct
- Make sure the repository exists on GitHub
- Use HTTPS URL: `https://github.com/YOUR_USERNAME/repo-name.git`

### "Authentication failed"
- Use Personal Access Token instead of password
- Make sure token has `repo` permissions

### "Updates were rejected"
- Run: `git pull origin main --allow-unrelated-histories`
- Then: `git push -u origin main`

## After Successful Push

Your code is now on GitHub! 🎉

Next steps:
1. View your repository at: `https://github.com/YOUR_USERNAME/networld-shipping-tracker`
2. Add a README with project description
3. Ready to deploy to hosting platform (Render, Railway, Heroku)

## Project Structure on GitHub
```
networld-shipping-tracker/
├── .env.example              ✅ (template for production)
├── .gitignore               ✅ (excludes .env and node_modules)
├── package.json             ✅
├── server.js                ✅
├── emailReceiver.js         ✅
├── admin.html               ✅
├── admin-script.js          ✅
├── admin-styles.css         ✅
├── index.html               ✅
├── login.html               ✅
├── inbox.html               ✅
├── script.js                ✅
├── styles.css               ✅
├── database/                ✅
│   ├── schema.sql
│   ├── seeds.sql
│   └── migrations/
└── DEPLOYMENT_GUIDE.md      ✅
```

## Security Notes
- ✅ `.env` file is excluded (contains secrets)
- ✅ `.env.example` is included (template for others)
- ✅ `node_modules/` excluded (will be installed via npm)
- ✅ `uploads/` excluded (user-generated files)

Your sensitive data (passwords, API keys) is safe! 🔒
