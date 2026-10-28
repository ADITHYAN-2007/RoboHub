import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/src/config/db.js';
import { seedDatabase } from './server/src/services/seed.js';
import { errorHandler } from './server/src/middleware/errorHandler.js';

// Route imports
import authRoutes from './server/src/routes/auth.routes.js';
import userRoutes from './server/src/routes/user.routes.js';
import equipmentRoutes from './server/src/routes/equipment.routes.js';
import reservationRoutes from './server/src/routes/reservation.routes.js';
import checkoutRoutes from './server/src/routes/checkout.routes.js';
import inventoryRoutes from './server/src/routes/inventory.routes.js';
import componentRequestRoutes from './server/src/routes/componentRequest.routes.js';
import projectRoutes from './server/src/routes/project.routes.js';
import maintenanceRoutes from './server/src/routes/maintenance.routes.js';
import issueRoutes from './server/src/routes/issue.routes.js';
import safetyRoutes from './server/src/routes/safety.routes.js';
import laboratoryRoutes from './server/src/routes/laboratory.routes.js';
import notificationRoutes from './server/src/routes/notification.routes.js';
import analyticsRoutes from './server/src/routes/analytics.routes.js';
import reportRoutes from './server/src/routes/report.routes.js';
import auditRoutes from './server/src/routes/audit.routes.js';
import searchRoutes from './server/src/routes/search.routes.js';
import settingsRoutes from './server/src/routes/settings.routes.js';
import docsRoutes from './server/src/routes/docs.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Parse port from environment or CLI arguments (--port 3000 / -p 3000)
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const portArgIndex = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      port = parsed;
    }
  }

  // Parse host from environment or CLI arguments (--host 0.0.0.0 / -h 0.0.0.0)
  let host = process.env.HOST || '0.0.0.0';
  const hostArgIndex = process.argv.findIndex((arg) => arg === '--host' || arg === '-h');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    host = process.argv[hostArgIndex + 1];
  }

  const isProd = process.env.NODE_ENV === 'production';

  // Core Express Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Background Database connection & seeding state
  let isDbReady = false;
  let dbInitError: Error | null = null;

  const initDbPromise = (async () => {
    try {
      console.log('[Server] Connecting to MongoDB and checking seed data...');
      await connectDB();
      await seedDatabase();
      isDbReady = true;
      console.log('[Server] MongoDB and initial seed data ready.');
    } catch (err: any) {
      console.error('[Server] Database initialization failed:', err);
      dbInitError = err;
    }
  })();

  // Fast Health check endpoint (always responds immediately, indicates DB state)
  app.get('/api/health', (req, res) => {
    res.json({
      status: isDbReady ? 'UP' : (dbInitError ? 'DEGRADED' : 'INITIALIZING'),
      ready: isDbReady,
      dbError: dbInitError ? dbInitError.message : null,
      app: 'Robo Lab Hub',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Database readiness guard for other /api routes
  app.use('/api', async (req, res, next) => {
    if (isDbReady) {
      return next();
    }
    if (dbInitError) {
      return res.status(503).json({
        success: false,
        message: 'Database initialization failed. Please reload or check server logs.',
        error: dbInitError.message,
      });
    }

    try {
      // Allow up to 10 seconds for initial DB connection on cold boot
      await Promise.race([
        initDbPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database startup timeout')), 10000)),
      ]);
      if (isDbReady) {
        return next();
      }
      return res.status(503).json({
        success: false,
        message: 'Database is still initializing. Please wait a moment...',
      });
    } catch {
      return res.status(503).json({
        success: false,
        message: 'Database is still initializing. Please wait a moment...',
      });
    }
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/checkouts', checkoutRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/component-requests', componentRequestRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/safety', safetyRoutes);
  app.use('/api/laboratories', laboratoryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/docs', docsRoutes);

  // Centralized Error Handler for API
  app.use('/api', errorHandler);

  // Frontend Integration: Vite middlewares in dev, static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static files from dist.');
  }

  // Final fallback error handler
  app.use(errorHandler);

  const server = app.listen(port, host, () => {
    console.log(`[Server] 🚀 Robo Lab Hub server running on http://${host}:${port}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        const { disconnectDB } = await import('./server/src/config/db.js');
        await disconnectDB();
        console.log('[Server] Database disconnected cleanly.');
      } catch (err) {
        console.error('[Server] Error during DB disconnect:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Server] Fatal error starting server:', err);
  process.exit(1);
});

