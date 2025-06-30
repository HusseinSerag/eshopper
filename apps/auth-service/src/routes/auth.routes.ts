import { Express } from 'express';
import { SignupController } from '../controllers/auth.controller';
import { validationMiddleware } from '@eshopper/middleware';
import { RegisterUserSchema } from '../schemas/auth.schema';
import express from 'express';
export function createRoutes(app: Express) {
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.post(
    '/register',
    validationMiddleware(RegisterUserSchema),
    SignupController
  );
  app.post('/login');
  app.post('/logout');
  app.post('/refresh');
  app.post('/reset-password');
  app.post('/verify-email');
  app.post('/resend-verification-email');
  app.post('/change-password');
}
