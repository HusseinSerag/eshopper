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

export const config = new ConfigProvider(ConfigSchema);
export const dbProvider = new DatabaseProvider(config.get('DATABASE_URL'));
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

app.get('/c', async (req, res, next) => {
  try {
    await dbProvider.getPrisma().users.create({
      data: {
        email: 'hey',
        name: 'eyas',
      },
    });
  } catch (e) {
    next(e);
    return;
  }
  res.json({
    message: 'eyas',
  });
});

app.get('/', async (req, res) => {
  const users = await dbProvider.getPrisma().users.findMany();
  res.json({
    users: users,
  });
});

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
