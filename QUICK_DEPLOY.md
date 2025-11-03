# Quick Deploy Instructions

## Deploy to Railway in 3 Steps

Since I cannot complete the deployment interactively, here are the manual steps to deploy your application:

### Step 1: Login to Railway

Open your terminal and run:
```bash
cd /Users/fabienp/resume-screening-system
railway login
```

This will open a browser window for authentication.

### Step 2: Deploy the Application

Run the automated deployment script:
```bash
./deploy.sh
```

Or manually:
```bash
# Initialize Railway project
railway init

# Set environment variables
railway variables set ANTHROPIC_API_KEY="your-anthropic-api-key-here"
railway variables set NODE_ENV="production"

# Deploy
railway up

# Generate public domain
railway domain
```

### Step 3: Get Your Deployment URL

```bash
railway domain
```

This will give you a URL like: `https://your-app.railway.app`

---

## Alternative: Deploy via Railway Web Dashboard

1. Go to https://railway.app/new
2. Click "Empty Project"
3. Click "Deploy from GitHub repo"
4. Select or create a new GitHub repository for this code
5. Railway will auto-detect the Node.js app and deploy it
6. Add environment variables in Railway dashboard:
   - ANTHROPIC_API_KEY: `your-anthropic-api-key-here`
   - NODE_ENV: `production`

---

## Verification Steps

After deployment:

1. **Check Health**:
   ```bash
   curl https://your-app.railway.app/api/health
   ```

2. **Test Upload**:
   Open browser: `https://your-app.railway.app`
   Upload a test resume

3. **View Logs**:
   ```bash
   railway logs
   ```

---

## Files Ready for Deployment

All necessary files have been created:
- ✅ .gitignore (excludes node_modules, logs, .env)
- ✅ railway.json (Railway configuration)
- ✅ nixpacks.toml (Build configuration)
- ✅ Procfile (Start command)
- ✅ package.json (Dependencies and scripts)
- ✅ Git repository initialized
- ✅ Initial commit created
- ✅ deploy.sh (Automated deployment script)

---

## Troubleshooting

If deployment fails:

1. Check Railway logs: `railway logs`
2. Verify environment variables are set
3. Ensure database.db has write permissions
4. Check Node.js version compatibility (requires Node 18+)

---

**Everything is ready! Just run `railway login` and then `./deploy.sh`**
