#!/bin/bash

# Resume Screening System - Setup Script

echo "╔════════════════════════════════════════════╗"
echo "║  Resume Screening System Setup            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from template..."
    cp .env.template .env
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

# Check for Claude API key
if grep -q "ANTHROPIC_API_KEY=$" .env || grep -q "ANTHROPIC_API_KEY=\"\"" .env; then
    echo ""
    echo "⚠️  Claude API key not configured!"
    echo ""
    echo "To get your API key:"
    echo "1. Visit https://console.anthropic.com/"
    echo "2. Sign up or log in"
    echo "3. Navigate to API Keys"
    echo "4. Create a new key"
    echo "5. Copy the key (starts with sk-ant-)"
    echo ""
    read -p "Enter your Claude API key (or press Enter to skip): " api_key

    if [ ! -z "$api_key" ]; then
        # Update .env with API key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        else
            # Linux
            sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        fi
        echo "✅ API key added to .env"
    else
        echo "⚠️  Skipped API key setup. Add it to .env later."
    fi
else
    echo "✅ Claude API key configured"
fi

# Check if database exists
if [ ! -f database.db ]; then
    echo ""
    echo "📦 Initializing database..."
    npm run init-db
else
    echo "✅ Database already initialized"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Setup Complete! 🎉                       ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "Then visit:"
echo "  http://localhost:3000"
echo ""
echo "For detailed setup instructions, see:"
echo "  - QUICKSTART.md (5-minute guide)"
echo "  - README.md (full documentation)"
echo ""
