#!/bin/bash
set -e  # Arrête le script si une commande échoue

APP_DIR=/home/ec2-user/app
cd $APP_DIR

# Rediriger toute la sortie vers un log pour déboguer
exec > >(tee -a /tmp/deploy.log) 2>&1
echo "🚀 Démarrage du déploiement à $(date)"

echo "🔐 Loading environment variables from Parameter Store..."

# Liste des variables à charger depuis Parameter Store
VARS=(
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  AUTH_MICROSOFT_ENTRA_ID_ID
  AUTH_MICROSOFT_ENTRA_ID_SECRET
  AUTH_MICROSOFT_ENTRA_ID_ISSUER
)

# Vérifier que AWS CLI est disponible
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé"
    exit 1
fi

for var in "${VARS[@]}"; do
  value=$(aws ssm get-parameter --name "$var" --with-decryption --query "Parameter.Value" --output text 2>/tmp/ssm_error.log)
  if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du chargement de $var"
    cat /tmp/ssm_error.log
    exit 1
  fi
  export $var="$value"
  echo "✅ Loaded $var"
done

echo "📦 Installing dependencies..."
npm ci --only=production || npm install  # npm ci est plus rapide et reproductible

echo "🧬 Generating Prisma client..."
npx prisma generate

echo "🛠 Applying migrations..."
npx prisma migrate deploy

echo "🏗 Building Next.js app..."
npm run build

# Arrêter l'ancienne instance PM2 si elle existe
echo "🛑 Stopping old PM2 instance..."
pm2 delete nextjs 2>/dev/null || true

echo "🚀 Starting application with PM2..."
pm2 start npm --name "nextjs" -- start

# Sauvegarder la configuration PM2
pm2 save
pm2 startup  # Pour que PM2 redémarre au boot

# Attendre que l'application soit vraiment prête
echo "⏳ Waiting for application to be ready..."
sleep 10

# Vérifier que l'application répond
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is responding on port 3000"
    exit 0
  fi
  echo "⏳ Waiting... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

echo "❌ Application failed to respond within timeout"
pm2 logs nextjs --lines 50 --nostream
exit 1