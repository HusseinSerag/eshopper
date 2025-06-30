import dotenv from 'dotenv';
import { z } from 'zod';
import { AppError, StatusCode } from '@eshopper/error-handler';
//import path from 'path';

export class ConfigProvider<T extends z.ZodSchema> {
  private readonly _config: Readonly<z.infer<T>>;

  constructor(schema: T) {
    dotenv.config({
      //  path: path.resolve(__dirname, 'src', 'config', '.env'),
    });

    try {
      const parsed = schema.parse(process.env);

      this._config = Object.freeze(parsed);
    } catch (e: unknown) {
      throw new AppError(
        `Config keys are missing: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
        StatusCode.INTERNAL_SERVER_ERROR,
        StatusCode.INTERNAL_SERVER_ERROR,
        false
      );
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
