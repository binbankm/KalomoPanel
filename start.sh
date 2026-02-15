#!/bin/sh

# 创建数据目录
mkdir -p /app/backend/data

# 运行数据库迁移
cd /app/backend
npx prisma migrate deploy

# 启动后端服务（后台）
node dist/index.js &

# 启动Nginx（前台）
nginx -g 'daemon off;'
