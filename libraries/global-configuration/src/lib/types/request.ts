import type { Request } from 'express';
import { Session, Users, Account } from '@eshopper/database';

export interface IRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  Query = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<Params, ResBody, ReqBody, Query, Locals> {
  userId?: string;
  user?: Users;
  session?: Session;
  account?: Account;
}
