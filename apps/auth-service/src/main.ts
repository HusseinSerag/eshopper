import express from 'express';
import {
  NotFoundHandler,
  ErrorHandlerMiddleware,
  setupErrorMonitoring,
  GracefulShutdownHandler,
} from '@eshopper/error-handler';
import cors from 'cors';
import { setupApp } from '@eshopper/global-configuration';
import { ConfigProvider } from '@eshopper/config-provider';
import { ConfigSchema } from './config/config.schema';
import { DatabaseProvider } from '@eshopper/database';
import { createRoutes } from './routes/auth.routes';
import { Redis } from '@eshopper/redis';
import { TokenProvider } from '@eshopper/auth';

export const config = new ConfigProvider(ConfigSchema);
export const dbProvider = new DatabaseProvider(config.get('DATABASE_URL'));
export const redisProvider = new Redis({
  type: 'url',
  url: config.get('REDIS_URL'),
});
export const tokenProvider = new TokenProvider(
  config.get('ACCESS_TOKEN_SECRET'),
  config.get('REFRESH_TOKEN_SECRET')
);
async function startApp() {
  setupErrorMonitoring(() => {
    dbProvider.disconnect();
  });
  dbProvider.connect();
  const host = config.get('HOST');
  const port = config.get('PORT');

  const app = express();

  setupApp(app);

  app.use(
    cors({
      credentials: true,
      origin: config.get('GATEWAY_ORIGIN'),
    })
  );

  app.get('/health', async (req, res) => {
    res.status(200).json({
      message: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      nodeEnv: process.env.NODE_ENV,
    });
  });

  createRoutes(app);
  app.use(NotFoundHandler);
  app.use(ErrorHandlerMiddleware);
  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });

  process.on('SIGINT', (signal) =>
    GracefulShutdownHandler(signal, app, () => {
      dbProvider.disconnect();
    })
  );

  process.on('SIGTERM', (signal) =>
    GracefulShutdownHandler(signal, app, () => {
      dbProvider.disconnect();
    })
  );

  return app;
}

startApp();
