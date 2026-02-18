#!/bin/bash
set -e

echo "🔍 Validating service at $(date)"

# Vérifier que PM2 a bien démarré
if ! pm2 show nextjs > /dev/null 2>&1; then
    echo "❌ PM2 process 'nextjs' not found"
    exit 1
fi

# Vérifier que l'application répond
if ! curl -s -f http://localhost:3000 > /dev/null; then
    echo "❌ Application not responding on port 3000"
    pm2 logs nextjs --lines 50 --nostream
    exit 1
fi

# Vérifier les logs pour des erreurs
if pm2 logs nextjs --lines 20 --nostream 2>&1 | grep -i "error\|exception\|fail" > /dev/null; then
    echo "⚠️  Found errors in logs, but continuing..."
    pm2 logs nextjs --lines 20 --nostream
fi

echo "✅ Service validation successful"
exit 0