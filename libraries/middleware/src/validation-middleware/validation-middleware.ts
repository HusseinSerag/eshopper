import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError, StatusCode } from '@eshopper/error-handler';

export function validationMiddleware(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    console.log(req.body, typeof req.body, req.body.country);
    if (result.success === false) {
      const error = result.error.errors
        .map((error) => error.message)
        .join(', ');
      next(
        new AppError(
          error,
          StatusCode.BAD_REQUEST,
          StatusCode.BAD_REQUEST,
          true
        )
      );
      return;
    }

    next();
  };
}
