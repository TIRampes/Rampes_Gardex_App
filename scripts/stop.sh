#!/bin/bash
set -e

echo "🛑 Stopping application at $(date)"

# Sauvegarder les logs avant d'arrêter
pm2 logs nextjs --lines 100 --nostream > /tmp/pm2_logs_before_stop.log 2>&1 || true

# Arrêter l'application proprement
pm2 stop nextjs 2>/dev/null || true
pm2 delete nextjs 2>/dev/null || true

echo "✅ Application stopped"