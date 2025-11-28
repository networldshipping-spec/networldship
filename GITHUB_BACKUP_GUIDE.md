# GitHub Backup Instructions for NET WORLD SHIPPING Project

## Step 1: Install Git (if not already installed)

Download and install Git from: https://git-scm.com/download/win

During installation:
- Select "Git from the command line and also from 3rd-party software"
- Select "Use Windows' default console window"
- Leave other options as default

After installation, restart PowerShell/Terminal.

## Step 2: Configure Git (First Time Only)

Open PowerShell and run:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com
2. Log in to your account
3. Click the "+" icon in top right → "New repository"
4. Repository name: `networld-shipping` (or your preferred name)
5. Description: "NET WORLD SHIPPING - Modern Shipment Tracking System"
6. Choose Public or Private
7. **DO NOT** initialize with README (we already have one)
8. Click "Create repository"

## Step 4: Initialize Git in Your Project

Open PowerShell in your project directory:

```powershell
# Navigate to project directory
cd C:\Users\HP\OneDrive\Desktop\nettrack

# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: NET WORLD SHIPPING tracking system with admin panel, receipts, and notifications"
```

## Step 5: Connect to GitHub and Push

Replace `YOUR_USERNAME` and `REPOSITORY_NAME` with your actual GitHub username and repository name:

```powershell
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### If you encounter authentication issues:

GitHub now requires Personal Access Token (PAT) instead of password.

**Create a Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "NetWorld Shipping Project"
4. Select scopes: Check "repo" (all repository permissions)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

**Use the token when pushing:**
```powershell
# When prompted for password, paste your Personal Access Token
git push -u origin main
```

Or use token in URL:
```powershell
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

## Step 6: Future Updates

After making changes to your project:

```powershell
# Check what files have changed
git status

# Add all changed files
git add .

# Commit with a descriptive message
git commit -m "Description of changes made"

# Push to GitHub
git push
```

## Quick Commands Reference

```powershell
# Check repository status
git status

# Add all files
git add .

# Add specific file
git add filename.js

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes from GitHub
git pull

# View commit history
git log --oneline

# Create new branch
git checkout -b branch-name

# Switch to existing branch
git checkout branch-name

# Merge branch into main
git checkout main
git merge branch-name
```

## What Gets Backed Up

✅ **Included in backup:**
- All source code (.js, .html, .css, .sql files)
- Database schema and migration files
- Configuration files (package.json, etc.)
- Documentation (README.md, setup guides)
- .gitignore file

❌ **Excluded from backup (per .gitignore):**
- node_modules/ (dependencies)
- uploads/ (user-uploaded files)
- .env files (sensitive configuration)
- IDE settings (.vscode/)
- Log files

## Important Notes

1. **Never commit sensitive data:**
   - Database passwords (already excluded in code)
   - API keys
   - Personal access tokens

2. **Keep node_modules excluded:**
   - These can be regenerated with `npm install`
   - Reduces repository size significantly

3. **Consider uploads folder:**
   - Currently excluded to save space
   - If you want to include sample images, remove `uploads/` from .gitignore

4. **Regular backups:**
   - Commit and push changes regularly
   - Use descriptive commit messages
   - Create branches for major features

## Troubleshooting

### Problem: "git: command not found"
**Solution:** Install Git from https://git-scm.com/download/win and restart terminal

### Problem: "Permission denied (publickey)"
**Solution:** Use HTTPS instead of SSH, or set up SSH keys

### Problem: "Authentication failed"
**Solution:** Use Personal Access Token instead of password

### Problem: "Updates were rejected"
**Solution:** Pull latest changes first: `git pull origin main`

### Problem: Files not being tracked
**Solution:** Check .gitignore file, remove entry if needed, then `git add` again

## Repository Structure After Push

```
networld-shipping/
├── database/
│   ├── migrations/
│   ├── schema.sql
│   └── seeds.sql
├── uploads/
│   └── .gitkeep
├── admin.html
├── admin-script.js
├── admin-styles.css
├── index.html
├── script.js
├── styles.css
├── server.js
├── package.json
├── setup-fresh-database.sql
├── update-sender-receiver-data.sql
├── NOTIFICATION_SETUP.md
├── README.md
└── .gitignore
```

## Next Steps After Backup

1. ✅ Verify files on GitHub.com
2. 📝 Add repository description and tags
3. 🌟 Star your own repository
4. 📄 Add a LICENSE file (MIT recommended)
5. 🔄 Set up GitHub Actions (optional, for CI/CD)
6. 👥 Add collaborators if needed
7. 🔒 Configure branch protection rules (for main branch)

## Keeping Your Backup Updated

Set a reminder to push changes regularly:

```powershell
# Quick update (daily workflow)
git add .
git commit -m "Daily update: [describe what you changed]"
git push
```

Good practices:
- Commit after completing each feature
- Push at end of each work session
- Create branches for experimental features
- Tag releases: `git tag v1.0.0 && git push --tags`
