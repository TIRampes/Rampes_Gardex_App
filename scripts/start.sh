#!/bin/bash
set -e  # Arrête le script si une commande échoue

APP_DIR=/home/ec2-user/app
cd $APP_DIR

# Rediriger toute la sortie vers un log pour déboguer
exec > >(tee -a /tmp/deploy.log) 2>&1
echo "========================================="
echo "🚀 Démarrage du déploiement à $(date)"
echo "========================================="

# Vérifier que nous sommes dans le bon répertoire
echo "📁 Répertoire courant : $(pwd)"
echo "📁 Contenu du répertoire :"
ls -la

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

# Charger les variables depuis Parameter Store
for var in "${VARS[@]}"; do
  echo "Chargement de $var..."
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
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

echo "🧬 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi
echo "✅ Prisma client generated"

echo "🛠 Applying migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "❌ Prisma migrate failed"
    exit 1
fi
echo "✅ Migrations applied"

echo "🏗 Building Next.js app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build completed"

# Arrêter l'ancienne instance PM2 si elle existe
echo "🛑 Stopping old PM2 instance if exists..."
pm2 delete nextjs 2>/dev/null || true

echo "🚀 Starting application with PM2..."
pm2 start npm --name "nextjs" -- start
if [ $? -ne 0 ]; then
    echo "❌ PM2 start failed"
    exit 1
fi
echo "✅ PM2 started"

# Sauvegarder la configuration PM2
pm2 save
echo "✅ PM2 configuration saved"

echo "⏳ Waiting for application to be ready (60 seconds maximum)..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
        echo "✅ Application is responding on port 3000 (HTTP $HTTP_CODE)"
        exit 0
    fi
    echo "⏳ Waiting... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

# Si on arrive ici, l'application n'a pas répondu
echo "❌ Application failed to respond within timeout"
echo "📋 PM2 process status:"
pm2 show nextjs
echo "📋 Last 50 lines of PM2 logs:"
pm2 logs nextjs --lines 50 --nostream
exit 1