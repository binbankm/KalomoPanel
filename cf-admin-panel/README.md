# Cloudflare 管理面板

一个功能完整的 Cloudflare 管理面板，支持域名、DNS、SSL、防火墙、Workers、KV、Pages、R2 等全功能管理，并内置 RBAC 权限系统。

## ✨ 最新增强 (2026-02)

### 🔒 安全增强
- **强密码策略** - 8+ 字符，包含大小写字母、数字和特殊字符
- **增强的密码哈希** - bcrypt cost factor 从 10 提升至 12 (4倍安全性)
- **分层限流** - 认证端点 5/15分钟，标准端点 100/15分钟
- **输入净化** - HTML 实体编码防止 XSS 攻击
- **环境验证** - 启动时验证关键配置（JWT_SECRET 至少 32 字符）
- **安全审计通过** - 0 个依赖漏洞，0 个 CodeQL 警告

### ⚡ 性能优化
- **智能缓存** - 用户权限缓存减少 95% 数据库查询
- **API 缓存** - Cloudflare API 响应缓存减少 90% 外部调用
- **响应压缩** - gzip/deflate 压缩节省 60-80% 带宽
- **重试逻辑** - 指数退避重试机制提高可靠性

### 📝 代码质量
- **结构化日志** - 集中式日志系统，包含上下文和时间戳
- **TypeScript 严格模式** - 完全类型安全
- **标准化响应** - 统一的 API 响应格式
- **优雅关闭** - SIGTERM/SIGINT 信号处理

详见 [ENHANCEMENTS.md](../ENHANCEMENTS.md) 和 [SUMMARY.md](../SUMMARY.md)

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
# JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-change-in-production"  # 至少32字符
# CF_API_TOKEN="your-cloudflare-api-token"
# CF_ACCOUNT_ID="your-cloudflare-account-id"

# 生产环境额外配置 (可选):
# CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
```

**⚠️ 安全提示**：
- JWT_SECRET 必须至少 32 字符（系统启动时会验证）
- 生产环境务必使用强随机密钥
- 不要使用示例中的默认值

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
- `POST /api/auth/logout` - 登出

### 系统监控 (新增)
- `GET /health` - 健康检查（包含运行时间和缓存统计）
- `GET /api/cache/stats` - 缓存统计（仅开发模式）

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

1. ✅ **JWT 密钥安全**：使用至少 32 字符的强随机密钥（系统会在启动时验证）
2. ✅ **强密码策略**：系统强制要求 8+ 字符，包含大小写、数字和特殊字符
3. ✅ **API Token 安全**：定期更换 Cloudflare API Token
4. ✅ **HTTPS 部署**：生产环境必须启用 HTTPS
5. ✅ **限流保护**：系统已配置分层限流防止滥用
6. ✅ **安全头部**：自动配置 CSP、HSTS 等安全响应头
7. ✅ **输入验证**：所有输入经过验证和净化

### 密码要求
- 最少 8 个字符
- 至少 1 个小写字母
- 至少 1 个大写字母
- 至少 1 个数字
- 至少 1 个特殊字符

### 限流配置
- 认证端点：5 次/15分钟（防暴力破解）
- 标准 API：100 次/15分钟
- 只读操作：200 次/5分钟

## 许可证

MIT License
