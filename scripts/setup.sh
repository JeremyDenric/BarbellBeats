#!/bin/bash

# Gym Music Share - Development Setup Script
# This script sets up the entire development environment

set -e  # Exit on error

echo "🎵 Gym Music Share - Development Setup 🏋️"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js version must be 20 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Check AWS CLI
echo "Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}Warning: AWS CLI not found${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    echo "You'll need it for backend deployment"
else
    echo -e "${GREEN}✓ AWS CLI found${NC}"
fi

# Check Expo CLI
echo "Checking Expo CLI..."
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}Expo CLI not found. Installing globally...${NC}"
    npm install -g expo-cli
fi
echo -e "${GREEN}✓ Expo CLI found${NC}"

# Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install

# Install shared package dependencies
echo ""
echo "Installing shared package dependencies..."
cd shared
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Shared package built${NC}"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Create .env files if they don't exist
echo ""
echo "Setting up environment files..."

if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠ Please edit backend/.env with your AWS and Spotify credentials${NC}"
fi

if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo -e "${YELLOW}⚠ Please edit frontend/.env with your API endpoints${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment variables:"
echo "   - Edit backend/.env with AWS credentials and Spotify API keys"
echo "   - Edit frontend/.env with API endpoints (after backend deployment)"
echo ""
echo "2. Deploy backend:"
echo "   cd backend"
echo "   npm run deploy"
echo ""
echo "3. Start frontend:"
echo "   cd frontend"
echo "   expo start"
echo ""
echo "For detailed instructions, see docs/GETTING_STARTED.md"
echo ""
