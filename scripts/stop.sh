#!/bin/bash
set -e

echo "========================================="
echo "🛑 Stopping application at $(date)"
echo "========================================="

# Sauvegarder les logs avant d'arrêter
echo "📋 Saving PM2 logs..."
pm2 logs nextjs --lines 100 --nostream > /tmp/pm2_logs_before_stop.log 2>&1 || true

# Vérifier si le processus existe
if pm2 show nextjs > /dev/null 2>&1; then
    echo "🛑 Stopping PM2 process 'nextjs'..."
    pm2 stop nextjs
    echo "🗑️ Deleting PM2 process..."
    pm2 delete nextjs
    echo "✅ Application stopped successfully"
else
    echo "ℹ️ No PM2 process named 'nextjs' found"
fi

# Sauvegarder la configuration
pm2 save
echo "✅ PM2 configuration saved"