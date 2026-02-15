import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error';
import { standardLimiter, authLimiter, sanitizeInputs, requestSizeValidator } from './middleware/security';
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
import { validateEnv } from './utils/validation';
import { logger } from './utils/logger';
import { cache } from './utils/cache';

// Load and validate environment variables
dotenv.config();

try {
  validateEnv();
  logger.info('Environment variables validated successfully');
} catch (error) {
  logger.error('Environment validation failed', error as Error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN?.split(',') || false
    : ['http://localhost:5173'],
  credentials: true,
}));

// Enable response compression
app.use(compression());

// Input sanitization
app.use(sanitizeInputs);

// Request size validation
app.use(requestSizeValidator(10));

// Parse JSON with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    // Expose only non-sensitive aggregate cache information on the public health endpoint
    cache: {
      enabled: true,
    },
  };
  res.json(healthStatus);
});

// Cache stats endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/cache/stats', (req, res) => {
    res.json(cache.stats());
  });
}

// API routes - apply standard rate limiting to all routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', standardLimiter, userRouter);
app.use('/api/roles', standardLimiter, roleRouter);
app.use('/api/domains', standardLimiter, domainRouter);
app.use('/api/dns', standardLimiter, dnsRouter);
app.use('/api/ssl', standardLimiter, sslRouter);
app.use('/api/firewall', standardLimiter, firewallRouter);
app.use('/api/analytics', standardLimiter, analyticsRouter);
app.use('/api/workers', standardLimiter, workersRouter);
app.use('/api/kv', standardLimiter, kvRouter);
app.use('/api/pages', standardLimiter, pagesRouter);
app.use('/api/r2', standardLimiter, r2Router);
app.use('/api/settings', standardLimiter, settingsRouter);
app.use('/api/logs', standardLimiter, logsRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Graceful shutdown handler
const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
