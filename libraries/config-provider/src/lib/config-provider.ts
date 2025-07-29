import dotenv from 'dotenv';
import { z, ZodError } from 'zod';
import { AppError, StatusCode } from '@eshopper/error-handler';
import { logger } from '@eshopper/logger';
//import path from 'path';

export class ConfigProvider<T extends z.ZodSchema> {
  private readonly _config: Readonly<z.infer<T>>;

  constructor(schema: T) {
    dotenv.config({
      //  path: path.resolve(__dirname, 'src', 'config', '.env'),
    });

    try {
      const parsed = schema.safeParse(process.env);

      if (!parsed.success) {
        throw Error(JSON.stringify(parsed.error.errors));
      }
      this._config = Object.freeze(parsed.data);
    } catch (e: unknown) {
      console.log(e);
      if (e instanceof ZodError) {
        console.log(e.errors);
        logger.info('Error adding enviroment variables', {
          error: e.errors.forEach((error) => error.message),
          errorStack: e.stack,
          msg: e.flatten(),
        });
      }
      logger.info('Error loading enviroment variables');
      process.exit(1);
    }
  }

  get<K extends keyof z.infer<T>>(key: K) {
    if (!this._config[key]) {
      throw new AppError(
        `Config key ${key.toString()} not found`,
        StatusCode.INTERNAL_SERVER_ERROR,
        StatusCode.INTERNAL_SERVER_ERROR,
        false
      );
    }
    return this._config[key];
  }
}
