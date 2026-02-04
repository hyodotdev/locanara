#!/bin/bash

# Locanara Docs Firebase Deployment Script
# This script handles local deployment to Firebase Hosting

set -e

echo "Starting Locanara docs deployment to Firebase..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found. Installing globally...${NC}"
    npm install -g firebase-tools
    echo -e "${GREEN}Firebase CLI installed successfully${NC}"
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}Please log in to Firebase...${NC}"
    firebase login
fi

echo -e "${BLUE}Building project...${NC}"

# Run build
bun run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please check the errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}Build completed successfully${NC}"

# Deploy to Firebase
echo -e "${BLUE}Deploying to Firebase Hosting...${NC}"

firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    echo -e "${BLUE}Your site is now live at https://locanara.web.app${NC}"
else
    echo -e "${RED}Deployment failed. Check the errors above.${NC}"
    exit 1
fi
