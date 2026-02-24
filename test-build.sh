#!/bin/bash

echo "🔨 Building the project..."
npm run build

echo ""
echo "📦 Checking build output structure..."
echo ""
echo "dist/ contents:"
ls -la dist/

echo ""
echo "dist/public/ contents:"
ls -la dist/public/ | head -20

echo ""
echo "dist/index.cjs exists: $([ -f dist/index.cjs ] && echo '✅ YES' || echo '❌ NO')"
echo ""
echo "dist/public/index.html exists: $([ -f dist/public/index.html ] && echo '✅ YES' || echo '❌ NO')"
echo ""

echo "🧪 Attempting to start server for 5 seconds..."
NODE_ENV=production timeout 5s node dist/index.cjs || true
