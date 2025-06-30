import type { Request } from 'express';
export interface IRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  Query = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<Params, ResBody, ReqBody, Query, Locals> {
  userId?: string;
}
