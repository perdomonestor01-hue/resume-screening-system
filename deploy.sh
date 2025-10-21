#!/bin/bash

# Resume Screening System - Automated Deployment Script
# Platform: Railway

set -e  # Exit on error

echo "================================================"
echo "Resume Screening System - Railway Deployment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed${NC}"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Or use Homebrew:"
    echo "  brew install railway"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check if logged in
echo -e "${BLUE}🔐 Checking Railway authentication...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo ""
    echo "Please login to Railway:"
    echo "  railway login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

RAILWAY_USER=$(railway whoami)
echo -e "${GREEN}✅ Logged in as: ${RAILWAY_USER}${NC}"
echo ""

# Check if git repository is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}⚠️  Git repository not initialized${NC}"
    echo -e "${BLUE}Initializing git repository...${NC}"
    git init
    git add -A
    git commit -m "Initial commit: Resume Screening System"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
    echo ""
fi

# Check if Railway project exists
echo -e "${BLUE}🚂 Checking Railway project...${NC}"
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No Railway project found${NC}"
    echo -e "${BLUE}Creating new Railway project...${NC}"
    railway init
    echo -e "${GREEN}✅ Railway project created${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Railway project exists${NC}"
    echo ""
fi

# Set environment variables
echo -e "${BLUE}⚙️  Configuring environment variables...${NC}"

# Read from .env file
if [ -f .env ]; then
    ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY .env | cut -d '=' -f2-)

    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "Setting ANTHROPIC_API_KEY..."
        railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" || true
    fi
fi

# Set NODE_ENV
echo "Setting NODE_ENV=production..."
railway variables set NODE_ENV="production" || true

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Deploy application
echo -e "${BLUE}🚀 Deploying to Railway...${NC}"
railway up

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""

# Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 5

# Get deployment URL
echo ""
echo -e "${BLUE}🌐 Getting deployment URL...${NC}"

# Generate domain if not exists
railway domain 2>&1 || true

DEPLOYMENT_URL=$(railway domain 2>&1 | grep -Eo 'https://[^ ]+' | head -1)

echo ""
echo "================================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "================================================"
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}Deployment URL:${NC}"
    echo -e "${BLUE}$DEPLOYMENT_URL${NC}"
    echo ""
    echo -e "${GREEN}Available pages:${NC}"
    echo "  - Upload: $DEPLOYMENT_URL/"
    echo "  - Dashboard: $DEPLOYMENT_URL/dashboard.html"
    echo "  - Jobs: $DEPLOYMENT_URL/jobs.html"
    echo ""
    echo -e "${GREEN}API Endpoints:${NC}"
    echo "  - Health: $DEPLOYMENT_URL/api/health"
    echo "  - Stats: $DEPLOYMENT_URL/api/stats"
    echo ""
else
    echo -e "${YELLOW}⚠️  Could not retrieve deployment URL${NC}"
    echo "Check Railway dashboard: https://railway.app/dashboard"
    echo ""
fi

echo -e "${BLUE}View logs:${NC}"
echo "  railway logs"
echo ""
echo -e "${BLUE}Open in browser:${NC}"
echo "  railway open"
echo ""
echo -e "${BLUE}Check status:${NC}"
echo "  railway status"
echo ""

# Test deployment
if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${BLUE}🧪 Testing deployment...${NC}"
    echo ""

    # Health check
    echo "Testing health endpoint..."
    if curl -sf "$DEPLOYMENT_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        echo "The application may still be starting. Please wait a moment and try again."
    fi

    echo ""
fi

echo "================================================"
echo -e "${GREEN}Deployment process complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test the application by uploading a resume"
echo "2. Check logs for any errors: railway logs"
echo "3. Configure optional services (email, geocoding) if needed"
echo ""
