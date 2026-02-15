import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { roleRouter } from './routes/roles';
import { domainRouter } from './routes/domains';
import { dnsRouter } from './routes/dns';
import { sslRouter } from './routes/ssl';
import { firewallRouter } from './routes/firewall';
import { analyticsRouter } from './routes/analytics';
import { workersRouter } from './routes/workers';
import { kvRouter } from './routes/kv';
import { pagesRouter } from './routes/pages';
import { r2Router } from './routes/r2';
import { settingsRouter } from './routes/settings';
import { logsRouter } from './routes/logs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
  credentials: true
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/roles', roleRouter);
app.use('/api/domains', domainRouter);
app.use('/api/dns', dnsRouter);
app.use('/api/ssl', sslRouter);
app.use('/api/firewall', firewallRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/kv', kvRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/r2', r2Router);
app.use('/api/settings', settingsRouter);
app.use('/api/logs', logsRouter);

// 错误处理
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});
