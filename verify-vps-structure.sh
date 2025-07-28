#!/bin/bash

# Verify VPS Structure Script
# Run this on your VPS to verify the structure is correct

echo "🔍 Verifying VPS structure..."

# Navigate to the correct directory
cd /home/digitalfuzed-schoolapi/htdocs/schoolapi.digitalfuzed.com

echo "📁 Current directory: $(pwd)"
echo "📁 Current structure:"
ls -la

echo ""
echo "🎯 Expected structure:"
echo "   /home/digitalfuzed-schoolapi/htdocs/schoolapi.digitalfuzed.com/"
echo "   ├── uploads/"
echo "   ├── logs/"
echo "   └── src/"

echo ""
echo "✅ Checking for required directories..."

# Check if required directories exist
if [ -d "uploads" ]; then
    echo "✅ uploads/ directory exists"
    echo "   📁 uploads contents:"
    ls -la uploads/
else
    echo "❌ uploads/ directory missing"
fi

if [ -d "logs" ]; then
    echo "✅ logs/ directory exists"
    echo "   📁 logs contents:"
    ls -la logs/
else
    echo "❌ logs/ directory missing"
fi

if [ -d "src" ]; then
    echo "✅ src/ directory exists"
    echo "   📁 src contents:"
    ls -la src/
else
    echo "❌ src/ directory missing"
fi

# Check for unwanted backend folder
if [ -d "backend" ]; then
    echo "❌ backend/ folder still exists (should be removed)"
else
    echo "✅ No unwanted backend/ folder"
fi

echo ""
echo "🔐 Checking ownership..."
ls -ld uploads/ logs/ src/ 2>/dev/null || echo "Some directories missing"

echo ""
echo "📋 Summary:"
echo "   - uploads/: $(test -d uploads && echo "✅" || echo "❌")"
echo "   - logs/: $(test -d logs && echo "✅" || echo "❌")"
echo "   - src/: $(test -d src && echo "✅" || echo "❌")"
echo "   - No backend/: $(test ! -d backend && echo "✅" || echo "❌")"

echo ""
echo "🎯 Structure verification complete!" 