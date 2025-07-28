#!/bin/bash

# Fix VPS Ownership and Permissions Script (Root Version)
# Run this on your VPS as root to fix all ownership issues

echo "🔧 Fixing VPS ownership and permissions (as root)..."

# Navigate to the correct directory
cd /home/digitalfuzed-schoolapi/htdocs/schoolapi.digitalfuzed.com

echo "📁 Current directory: $(pwd)"
echo "📁 Current ownership issues:"
ls -ll

# Define the correct user and group
APP_USER="digitalfuzed-schoolapi"
APP_GROUP="digitalfuzed-schoolapi"

echo "👤 Setting correct ownership for all files and directories..."

# Fix ownership for all files and directories (no sudo needed as root)
chown -R $APP_USER:$APP_GROUP .

# Set proper permissions
echo "🔐 Setting proper permissions..."

# Directories should be 755
find . -type d -exec chmod 755 {} \;

# Files should be 644
find . -type f -exec chmod 644 {} \;

# Make executable files executable
chmod +x index.js 2>/dev/null || true
chmod +x *.sh 2>/dev/null || true

# Special permissions for uploads and logs
echo "📁 Setting special permissions for uploads and logs..."
chmod -R 755 uploads/
chmod -R 755 logs/

# Ensure uploads subdirectories exist
mkdir -p uploads/{documents,receipts,id-cards,logos}

# Fix specific ownership for critical directories
echo "🎯 Fixing critical directory ownership..."
chown -R $APP_USER:$APP_GROUP uploads/
chown -R $APP_USER:$APP_GROUP logs/
chown -R $APP_USER:$APP_GROUP src/
chown -R $APP_USER:$APP_GROUP node_modules/

# Remove the nested backend folder if it exists
if [ -d "backend" ]; then
    echo "🚨 Found backend folder. Checking if it's nested..."
    if [ -d "backend/backend" ]; then
        echo "📦 Moving nested backend contents..."
        # Backup important files
        cp -r backend/uploads/* uploads/ 2>/dev/null || true
        cp -r backend/logs/* logs/ 2>/dev/null || true
        
        # Move all contents
        mv backend/backend/* . 2>/dev/null || true
        mv backend/backend/.* . 2>/dev/null || true
        
        # Remove empty directories
        rmdir backend/backend 2>/dev/null || true
        rmdir backend 2>/dev/null || true
        
        echo "✅ Nested backend structure removed!"
    else
        echo "📦 Moving backend contents to root..."
        mv backend/* . 2>/dev/null || true
        mv backend/.* . 2>/dev/null || true
        rmdir backend 2>/dev/null || true
    fi
fi

# Final ownership check
echo "📁 Final ownership and permissions:"
ls -ll

echo "✅ Ownership and permissions fixed!"
echo "🎯 Your application should now work correctly with proper file access." 