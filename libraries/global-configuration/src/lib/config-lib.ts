import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import type { IRequest } from './types/request';
import { BadRequestError } from '@eshopper/error-handler';
import type { Request, Response, NextFunction } from 'express';
export function validateHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = req.headers['x-origin-site'];
  if (!origin) {
    next(new BadRequestError('Please specify the origin site header!'));
  }
  next();
}
export function setupApp(app: express.Express) {
  app.use(
    express.json({
      limit: '100mb',
    })
  );
  app.use(
    express.urlencoded({
      limit: '100mb',
      extended: true,
    })
  );
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: IRequest) => {
      return req.userId ? 1000 : 100;
    },
    message: {
      error: 'too many requests, please try again later!',
    },
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator(req: IRequest) {
      return req.ip as string;
    },
  });

  app.use(limiter);
}
