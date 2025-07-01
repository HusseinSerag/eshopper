import express from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';
import { setupApp } from '@eshopper/global-configuration';
import { ConfigProvider } from '@eshopper/config-provider';
import { ConfigSchema } from './config/config.schema';
import {
  ErrorHandlerMiddleware,
  NotFoundHandler,
  setupErrorMonitoring,
} from '@eshopper/error-handler';

setupErrorMonitoring(() => {
  console.log('error');
});

const config = new ConfigProvider(ConfigSchema);
const host = config.get('HOST');
const port = config.get('PORT');

const app = express();

setupApp(app);

app.use(
  cors({
    origin: config.get('CLIENT_ORIGIN').split(','),
    credentials: true,
  })
);

app.get('/', (req, res) => {
  res.send({ message: 'API Gateway' });
});

app.use('/auth', proxy(config.get('AUTH_SERVICE')));
app.use('/notification', proxy(config.get('NOTIFICATION_SERVICE')));

app.use(NotFoundHandler);
app.use(ErrorHandlerMiddleware);
app.listen(port, host, () => {
  console.log(`[ready] http://${host}:${port}`);
});
