#!/bin/bash

# Migration script to upgrade to the new backend with all features
# Run this from the server directory

set -e

echo "🚀 Starting backend migration to production-ready version..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the server directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Backing up existing files...${NC}"
# Backup existing files
if [ -f "src/index.ts" ]; then
    cp src/index.ts src/index-backup.ts
    echo "✅ Backed up index.ts"
fi

if [ -f "src/config/env.ts" ]; then
    mkdir -p src/config
    cp src/config/env.ts src/config/env-backup.ts
    echo "✅ Backed up env.ts"
fi

if [ -f "src/services/auth.service.ts" ]; then
    mkdir -p src/services
    cp src/services/auth.service.ts src/services/auth.service-backup.ts
    echo "✅ Backed up auth.service.ts"
fi

if [ -f "package.json" ]; then
    cp package.json package-backup.json
    echo "✅ Backed up package.json"
fi

if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backed up .env"
fi

echo ""
echo -e "${YELLOW}📝 Step 2: Replacing files with new versions...${NC}"

# Replace with new versions
if [ -f "src/index-updated.ts" ]; then
    mv src/index-updated.ts src/index.ts
    echo "✅ Updated index.ts"
fi

if [ -f "src/config/env-updated.ts" ]; then
    mv src/config/env-updated.ts src/config/env.ts
    echo "✅ Updated env.ts"
fi

if [ -f "src/services/auth-prisma.service.ts" ]; then
    mv src/services/auth-prisma.service.ts src/services/auth.service.ts
    echo "✅ Updated auth.service.ts"
fi

if [ -f "package-updated.json" ]; then
    mv package-updated.json package.json
    echo "✅ Updated package.json"
fi

echo ""
echo -e "${YELLOW}📦 Step 3: Installing new dependencies...${NC}"
npm install

echo ""
echo -e "${YELLOW}⚙️  Step 4: Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo "✅ Created .env from template"
        echo ""
        echo -e "${RED}⚠️  IMPORTANT: Edit .env and set your configuration!${NC}"
        echo "   - Set DATABASE_URL"
        echo "   - Generate JWT_SECRET and JWT_REFRESH_SECRET"
        echo "   - Configure SMTP settings (optional)"
        echo "   - Add SENTRY_DSN (optional)"
    fi
else
    echo "✅ .env already exists"
    echo ""
    echo -e "${YELLOW}⚠️  Please update your .env with new variables:${NC}"
    echo "   - DATABASE_URL (required)"
    echo "   - REDIS_URL (optional)"
    echo "   - SMTP_* settings (optional)"
    echo "   - SENTRY_DSN (optional)"
    echo "   - FRONTEND_URL (required)"
fi

echo ""
echo -e "${YELLOW}🗄️  Step 5: Checking database setup...${NC}"

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=" .env; then
    echo "✅ DATABASE_URL found in .env"
    
    echo ""
    read -p "Do you want to setup the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Generating Prisma Client..."
        npm run db:generate
        
        echo ""
        read -p "Do you want to push the schema to the database? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run db:push
            
            echo ""
            read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                npm run db:seed
                echo ""
                echo -e "${GREEN}✅ Database seeded with test data!${NC}"
                echo ""
                echo -e "${GREEN}Test Credentials:${NC}"
                echo "   Admin: admin@example.com / Admin123!"
                echo "   User 1: user1@example.com / Test123!"
                echo "   User 2: user2@example.com / Test123!"
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured${NC}"
    echo "   Add it to .env to enable database features"
fi

echo ""
echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo "📚 Next steps:"
echo "   1. Review and update your .env file"
echo "   2. Start Docker services if using: docker-compose up -d"
echo "   3. Run database migrations: npm run db:migrate"
echo "   4. Start the server: npm run dev"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   - NEXT_STEPS_COMPLETE.md"
echo "   - PROJECT_SUMMARY.md"
echo ""
echo "🎉 Your backend is now production-ready!"
