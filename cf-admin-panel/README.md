# Cloudflare 管理面板

一个功能完整的 Cloudflare 管理面板，支持域名、DNS、SSL、防火墙、Workers、KV、Pages、R2 等全功能管理，并内置 RBAC 权限系统。

## 功能特性

- **域名管理** - 查看和管理 Cloudflare 域名
- **DNS 管理** - 完整的 DNS 记录管理（A、AAAA、CNAME、MX、TXT 等）
- **SSL/TLS** - SSL 证书和加密配置
- **防火墙** - 防火墙规则、IP 访问控制、WAF 规则
- **分析统计** - 流量分析、安全事件、性能报告
- **Workers** - Cloudflare Workers 脚本管理
- **KV 存储** - KV 命名空间和键值对管理
- **Pages** - Cloudflare Pages 项目管理
- **R2 存储** - R2 对象存储 Bucket 管理
- **用户系统** - 完整的 RBAC 权限管理
- **操作日志** - 完整的操作审计日志

## 技术栈

### 后端
- Node.js + Express.js
- TypeScript
- Prisma ORM + SQLite
- JWT 认证
- Cloudflare API 集成

### 前端
- React 18 + TypeScript
- Vite
- TanStack Query
- React Router
- Tailwind CSS + ShadcnUI
- Zustand 状态管理

### 部署
- Docker + Docker Compose
- Nginx 反向代理

## 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- Cloudflare API Token

### 1. 克隆项目

```bash
git clone <repository-url>
cd cf-admin-panel
```

### 2. 配置环境变量

```bash
# 后端环境变量
cp backend/.env.example backend/.env

# 编辑 backend/.env 文件，填入以下配置：
# DATABASE_URL="file:./data/dev.db"
# JWT_SECRET="your-super-secret-jwt-key"
# CF_API_TOKEN="your-cloudflare-api-token"
# CF_ACCOUNT_ID="your-cloudflare-account-id"
```

### 3. Docker 部署（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问 http://localhost:18080

### 4. 开发模式

#### 后端
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

#### 前端
```bash
cd frontend
npm install
npm run dev
```

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

**注意**: 生产环境请立即修改默认密码！

## 项目结构

```
cf-admin-panel/
├── backend/              # Node.js 后端
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置文件
│   │   └── utils/        # 工具函数
│   ├── prisma/           # 数据库模型
│   └── package.json
├── frontend/             # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # UI 组件
│   │   ├── store/        # 状态管理
│   │   └── lib/          # 工具函数
│   └── package.json
├── docker-compose.yml    # Docker 编排
├── Dockerfile            # Docker 构建
└── nginx.conf            # Nginx 配置
```

## API 文档

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/change-password` - 修改密码

### 用户管理
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 角色权限
- `GET /api/roles` - 角色列表
- `GET /api/roles/permissions` - 权限列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色

### Cloudflare API
- `GET /api/domains` - 域名列表
- `GET /api/dns/:zoneId/records` - DNS 记录
- `GET /api/ssl/:zoneId/settings` - SSL 设置
- `GET /api/firewall/:zoneId/rules` - 防火墙规则
- `GET /api/workers/scripts` - Workers 脚本
- `GET /api/kv/namespaces` - KV 命名空间
- `GET /api/pages/projects` - Pages 项目
- `GET /api/r2/buckets` - R2 Buckets

## 权限系统

系统内置 4 个默认角色：

| 角色 | 说明 |
|------|------|
| super_admin | 超级管理员，拥有所有权限 |
| admin | 管理员，可管理大部分功能 |
| operator | 操作员，可执行日常操作 |
| viewer | 只读用户，只能查看数据 |

## 安全建议

1. 生产环境请修改默认 JWT_SECRET
2. 使用强密码策略
3. 定期更换 Cloudflare API Token
4. 启用 HTTPS
5. 配置适当的防火墙规则

## 许可证

MIT License
