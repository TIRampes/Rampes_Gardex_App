#!/bin/bash
set -e

LOG_FILE="/tmp/deploy.log"
exec > >(tee -a $LOG_FILE) 2>&1

echo "========================================="
echo "🚀 Démarrage du déploiement à $(date)"
echo "========================================="

# 🔧 CORRECTION DES PERMISSIONS - CRUCIAL !
echo "🔧 Correction des permissions..."
sudo chown -R ec2-user:ec2-user /home/ec2-user/app
sudo chmod -R 755 /home/ec2-user/app

APP_DIR=/home/ec2-user/app
cd $APP_DIR

echo "📁 Répertoire courant : $(pwd)"
echo "📁 Propriétaire du répertoire :"
ls -ld /home/ec2-user/app

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
pm2 save

echo "✅ Déploiement terminé avec succès"