#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print with colors
print_status() {
    echo -e "${BLUE}[Deploy]:${NC} $1"
}

print_success() {
    echo -e "${GREEN}[Success]:${NC} $1"
}

print_error() {
    echo -e "${RED}[Error]:${NC} $1"
}

# Check if there are any changes to commit
if [[ -z $(git status -s) ]]; then
    print_error "No changes to commit!"
    exit 1
fi

# Show current changes
echo -e "\n${BLUE}Current changes:${NC}"
git status -s
echo -e "\n"

# Prompt for commit message
read -p "Enter commit message: " commit_message

if [[ -z "$commit_message" ]]; then
    print_error "Commit message cannot be empty!"
    exit 1
fi

# Execute Git commands
print_status "Adding all changes..."
git add .

print_status "Committing changes..."
git commit -m "$commit_message"

if [ $? -eq 0 ]; then
    print_success "Changes committed successfully!"
else
    print_error "Failed to commit changes!"
    exit 1
fi

print_status "Pushing to remote repository..."
git push

if [ $? -eq 0 ]; then
    print_success "🚀 Deployment successful!"
    print_success "Changes are now live on GitHub"
else
    print_error "Failed to push changes!"
    exit 1
fi 