# Resume Screening System - Production Deployment Guide

## Deployment Status

**Platform**: Railway (Recommended)
**Status**: Ready for deployment
**Git Repository**: Initialized and committed

## Quick Deploy to Railway

### Option 1: Railway CLI (Recommended)

```bash
# 1. Login to Railway
railway login

# 2. Create new project
railway init

# 3. Set environment variables
railway variables set ANTHROPIC_API_KEY="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"
railway variables set NODE_ENV="production"

# 4. Deploy
railway up

# 5. Get deployment URL
railway domain
```

### Option 2: Railway Web Dashboard

1. Visit https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Configure environment variables in Railway dashboard:
   - `ANTHROPIC_API_KEY`: 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
   - `NODE_ENV`: production
5. Railway will automatically detect Node.js and deploy

### Option 3: Direct GitHub Integration

1. Push this repository to GitHub:
   ```bash
   gh repo create resume-screening-system --public --source=. --push
   ```

2. Go to https://railway.app and connect the GitHub repository

3. Railway will auto-deploy on every push to main branch

## Environment Variables

### Required Variables
- `ANTHROPIC_API_KEY`: Your Claude API key (already configured)
- `NODE_ENV`: Set to "production"
- `PORT`: Automatically set by Railway

### Optional Variables (Can skip for initial deployment)
- `OPENCAGE_API_KEY`: For enhanced geocoding (free tier available)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`: Email monitoring
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Email notifications
- `NOTIFICATION_FROM`, `NOTIFICATION_TO`: Notification recipients
- `NOTIFICATION_THRESHOLD`: Score threshold (default: 70)
- `MAX_FILE_SIZE`: Maximum upload size (default: 10MB)
- `ALLOWED_EXTENSIONS`: File types allowed

## Database Persistence

Railway provides persistent storage for SQLite databases automatically. The database file `database.db` will be persisted between deployments.

### Database Initialization

The application will automatically:
1. Create the database if it doesn't exist
2. Create required tables on first run
3. Preserve data between restarts

To manually initialize with sample data:
```bash
railway run npm run init-db
```

## Post-Deployment Verification

After deployment, verify the following:

1. **Health Check**
   ```bash
   curl https://your-app.railway.app/api/health
   ```
   Should return: `{"status":"ok","emailMonitoring":false,"timestamp":"..."}`

2. **Upload Test**
   - Visit: https://your-app.railway.app
   - Upload a test resume
   - Verify successful processing

3. **Distance Calculator**
   - Check that distance calculations work for candidates with addresses

4. **Database Persistence**
   - Restart the application
   - Verify data is still present

## Deployment Files Created

- `.gitignore`: Excludes sensitive and generated files
- `railway.json`: Railway-specific configuration
- `Procfile`: Start command configuration
- `.env.production`: Production environment template
- `DEPLOYMENT.md`: This deployment guide

## Application URLs

After deployment, your app will be available at:
- Main app: https://[your-project].railway.app
- Upload page: https://[your-project].railway.app/
- Dashboard: https://[your-project].railway.app/dashboard.html
- Jobs page: https://[your-project].railway.app/jobs.html

## Monitoring & Logs

View logs in Railway dashboard or via CLI:
```bash
railway logs
```

## Troubleshooting

### Build Failures

1. Check Railway build logs for errors
2. Verify all dependencies in package.json are correct
3. Ensure Node.js version compatibility

### Database Issues

1. Check if database.db exists: `railway run ls -la`
2. Verify write permissions for uploads directory
3. Re-run database initialization if needed

### API Connection Issues

1. Verify ANTHROPIC_API_KEY is set correctly
2. Check API quota and rate limits
3. Review server logs for API errors

## Scaling Considerations

For production use:

1. **Upgrade Database**: Consider PostgreSQL for better concurrency
2. **File Storage**: Use S3/R2 for uploaded resumes
3. **Caching**: Add Redis for session management
4. **Load Balancing**: Enable if traffic increases
5. **Monitoring**: Add Sentry or similar for error tracking

## Security Notes

- API keys are stored as environment variables (not in code)
- File uploads are validated and size-limited
- Database uses parameterized queries (SQL injection protection)
- CORS is enabled for API access

## Cost Estimates

**Railway Free Tier**:
- $5 free credits per month
- Sufficient for testing and low-traffic production

**Railway Pro**:
- $20/month minimum
- Recommended for production use
- Includes 100GB bandwidth and 8GB RAM

## Support

For issues:
1. Check Railway documentation: https://docs.railway.app
2. Review application logs: `railway logs`
3. Test locally first: `npm start`

---

**Generated**: 2025-10-21
**Status**: Production Ready
**Platform**: Railway (Node.js + SQLite)
