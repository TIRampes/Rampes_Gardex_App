#!/bin/bash

APP_DIR=/home/ec2-user/app

cd $APP_DIR

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

for var in "${VARS[@]}"; do
  export $var=$(aws ssm get-parameter --name "$var" --with-decryption --query "Parameter.Value" --output text)
  echo "Loaded $var"
done

echo "📦 Installing dependencies..."
npm install

echo "🧬 Generating Prisma client..."
npx prisma generate

echo "🛠 Applying migrations..."
npx prisma migrate deploy

echo "🏗 Building Next.js app..."
npm run build

echo "♻️ Restarting application with PM2..."
pm2 delete nextjs || true
pm2 start npm --name "nextjs" -- start
pm2 save

echo "✅ Deployment completed successfully."
