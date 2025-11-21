#!/bin/bash

echo "🚀 Deploying Eyes AI CRM to DigitalOcean..."
echo ""

# Sync files to server (excluding node_modules, .next, .git)
echo "📦 Syncing files to server..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude 'check-users.js' --exclude 'create-user.js' /Users/dylanhecht/eyesai-crm/ root@64.225.63.17:/var/www/eyesai-crm/

# Build and restart on server
echo ""
echo "🔨 Building application on server..."
ssh root@64.225.63.17 "cd /var/www/eyesai-crm && npm run build && pm2 restart eyesai-crm"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://64.225.63.17:3001"
echo ""
echo "📊 To view logs: ssh root@64.225.63.17 'pm2 logs eyesai-crm'"
