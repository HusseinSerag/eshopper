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
    origin: config.get('CLIENT_ORIGIN'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'fallback_access_token',
      'fallback_refresh_token',
    ],
  })
);

app.get('/', (req, res) => {
  res.send({ message: 'API Gateway' });
});

app.use(
  '/auth',
  proxy(config.get('AUTH_SERVICE'), {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (proxyReqOpts.headers && 'x-forwarded-host' in proxyReqOpts.headers) {
        proxyReqOpts.headers['x-forwarded-host'] = srcReq.headers.host;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      const authHeader = proxyRes.headers['authorization'];
      const accessToken = proxyRes.headers['fallback_access_token'];
      const refreshToken = proxyRes.headers['fallback_refresh_token'];

      if (authHeader) {
        userRes.setHeader('Authorization', authHeader);
      }
      if (accessToken) {
        userRes.setHeader('Fallback_access_token', accessToken);
      }
      if (refreshToken) {
        userRes.setHeader('Fallback_refresh_token', refreshToken);
      }

      // Ensure these are exposed to frontend
      userRes.setHeader(
        'Access-Control-Expose-Headers',
        'Authorization, Fallback_access_token, Fallback_refresh_token'
      );

      return proxyResData;
    },
    preserveHostHdr: true,
  })
);
app.use('/notification', proxy(config.get('NOTIFICATION_SERVICE')));

app.use(NotFoundHandler);
app.use(ErrorHandlerMiddleware);
app.listen(port, host, () => {
  console.log(`[ready] http://${host}:${port}`);
});
