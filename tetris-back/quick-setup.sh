#!/bin/bash

# Quick Setup Script for Auth Module
# This script automates the setup process

set -e

echo "🚀 Starting Auth Module Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠ MySQL client not found. Ensure MySQL server is running.${NC}"
else
    echo -e "${GREEN}✓ MySQL client found${NC}"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠ redis-cli not found. Ensure Redis server is running.${NC}"
else
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis is not responding. Please start Redis.${NC}"
    fi
fi

echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Setup .env if not exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    
    # Generate JWT secrets
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    cat > .env << EOF
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="mysql://root:password@localhost:3306/tetris_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:4200

# OAuth (Optional - configure later)
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-secret
# GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GITHUB_CLIENT_ID=your-client-id
# GITHUB_CLIENT_SECRET=your-secret
# GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
EOF
    
    echo -e "${GREEN}✓ .env file created with secure secrets${NC}"
    echo -e "${YELLOW}⚠ Please update DATABASE_URL in .env with your MySQL credentials${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Step 4: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 5: Run migrations
echo "🗄️  Running database migrations..."
echo -e "${YELLOW}Note: Ensure your database is accessible with the credentials in .env${NC}"
read -p "Continue with migration? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name init-auth-system
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Skipped migrations. Run manually: npx prisma migrate dev${NC}"
fi
echo ""

# Step 6: Summary
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Configure OAuth providers (optional)"
echo "3. Start the server: npm run start:dev"
echo ""
echo "📚 Documentation:"
echo "   - SETUP_INSTRUCTIONS.md - Detailed setup guide"
echo "   - ENV_VARIABLES.md - Environment variables"
echo "   - TEST_ENDPOINTS.md - API testing guide"
echo "   - src/auth/README.md - Module documentation"
echo ""
echo "🧪 Test the API:"
echo "   Server will run at: http://localhost:3000"
echo "   Swagger UI: http://localhost:3000/api"
echo ""
echo "Happy coding! 🎉"

