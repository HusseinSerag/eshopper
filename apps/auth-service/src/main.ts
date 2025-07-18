import { dbProvider, redisProvider, kafkaProvider } from './provider';
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
export const config = new ConfigProvider(ConfigSchema);
import { createRoutes } from './routes/auth.routes';
import { SessionCleanupJob } from './jobs/deleteSessionJobs';
import { UnverifiedUserCleanupJob } from './jobs/deleteUserJob';

async function startApp() {
  setupErrorMonitoring(() => {
    dbProvider.disconnect();
    redisProvider.close();
    kafkaProvider.disconnect();
  });
  dbProvider.connect();
  await kafkaProvider.connect();
  const host = config.get('HOST');
  const port = config.get('PORT');

  const app = express();

  setupApp(app);

  app.use(
    cors({
      credentials: true,
      origin: [config.get('CLIENT_ORIGIN'), config.get('SELLER_ORIGIN')],
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

  // Mount all auth routes under /auth
  createRoutes(app);

  app.use(NotFoundHandler);
  app.use(ErrorHandlerMiddleware);
  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });

  process.on('SIGINT', (signal) =>
    GracefulShutdownHandler(signal, app, () => {
      dbProvider.disconnect();
      redisProvider.close();
      kafkaProvider.disconnect();
    })
  );

  process.on('SIGTERM', (signal) =>
    GracefulShutdownHandler(signal, app, () => {
      dbProvider.disconnect();
      redisProvider.close();
      kafkaProvider.disconnect();
    })
  );

  return app;
}

startApp().then(() => {
  const unverifiedUserCleanupJob = new UnverifiedUserCleanupJob(dbProvider);
  const expiredSessionCleanupJob = new SessionCleanupJob(dbProvider);
  unverifiedUserCleanupJob.start();
  expiredSessionCleanupJob.start();
});
