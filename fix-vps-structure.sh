#!/bin/bash

# Fix VPS Nested Backend Structure Script
# Run this on your VPS to fix the nested backend folder issue

echo "🔧 Fixing nested backend structure on VPS..."

# Navigate to the correct directory
cd /home/digitalfuzed-schoolapi/htdocs/schoolapi.digitalfuzed.com

echo "📁 Current directory: $(pwd)"
echo "📁 Current structure:"
ls -la

# Check if nested backend exists
if [ -d "backend/backend" ]; then
    echo "🚨 Found nested backend structure. Fixing..."
    
    # Backup important files
    echo "💾 Backing up important files..."
    cp .env /tmp/backend_env_backup 2>/dev/null || echo "No .env to backup"
    cp -r backend/uploads /tmp/uploads_backup 2>/dev/null || echo "No uploads to backup"
    cp -r backend/logs /tmp/logs_backup 2>/dev/null || echo "No logs to backup"
    
    # Move backend contents to parent directory
    echo "📦 Moving backend contents..."
    mv backend/backend/* .
    mv backend/backend/.* . 2>/dev/null || echo "No hidden files to move"
    
    # Remove empty backend directory
    rmdir backend/backend
    rmdir backend
    
    # Restore important files
    echo "🔄 Restoring important files..."
    mv /tmp/backend_env_backup .env 2>/dev/null || echo "No .env to restore"
    cp -r /tmp/uploads_backup/* uploads/ 2>/dev/null || echo "No uploads to restore"
    cp -r /tmp/logs_backup/* logs/ 2>/dev/null || echo "No logs to restore"
    
    # Cleanup
    rm -rf /tmp/uploads_backup /tmp/logs_backup
    
    echo "✅ Nested structure fixed!"
else
    echo "✅ No nested backend structure found."
fi

# Ensure proper directory structure
echo "📁 Creating proper directory structure..."
mkdir -p uploads/{documents,receipts,id-cards,logos}
mkdir -p logs

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R digitalfuzed-schoolapi:digitalfuzed-schoolapi uploads logs
sudo chmod -R 755 uploads
sudo chmod -R 755 logs

echo "📁 Final structure:"
ls -la

echo "✅ VPS structure fixed successfully!"
echo "🎯 Next deployment will use the corrected GitHub Actions workflow." 