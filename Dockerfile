# 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 构建后端
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate

# 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 安装Nginx
RUN apk add --no-cache nginx

# 复制后端
COPY --from=backend-builder /app/backend ./backend
WORKDIR /app/backend
RUN npx prisma generate

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
