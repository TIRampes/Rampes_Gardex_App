#!/bin/bash
set -e

echo "========================================="
echo "🔍 Validating service at $(date)"
echo "========================================="

# Vérifier que PM2 a bien démarré
if ! pm2 show nextjs > /dev/null 2>&1; then
    echo "❌ PM2 process 'nextjs' not found"
    echo "📋 Available PM2 processes:"
    pm2 list
    exit 1
fi
echo "✅ PM2 process found"

# Donner un peu plus de temps à l'application
echo "⏳ Giving application a few seconds to stabilize..."
sleep 5

# Vérifier que l'application répond avec un code HTTP 200
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application is responding with HTTP 200"
    
    # Vérification supplémentaire - récupérer le titre de la page
    PAGE_TITLE=$(curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>" | head -1)
    echo "📄 Page title: $PAGE_TITLE"
    
    exit 0
else
    echo "❌ Application not responding correctly (HTTP $HTTP_CODE)"
    echo "📋 PM2 process status:"
    pm2 show nextjs
    echo "📋 Last 20 lines of PM2 logs:"
    pm2 logs nextjs --lines 20 --nostream
    echo "📋 Checking if port 3000 is listening:"
    netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
    exit 1
fi