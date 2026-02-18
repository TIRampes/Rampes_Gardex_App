#!/bin/bash

cd /home/ec2-user/app

npm install
npx prisma generate
npm run build

pm2 delete nextjs || true
pm2 start npm --name "nextjs" -- start
