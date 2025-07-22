import { asyncErrorHandler } from '@eshopper/error-handler';
import type { IRequest } from '@eshopper/global-configuration';

import type { Response } from 'express';

import {
  getPhoneNumberVerificationInfoService,
  getSellerMeService,
  requestPhoneNumberConfirmation,
  validatePhoneNumberOtp,
} from '../services/auth-seller.service';
import z from 'zod';
import {
  ConfirmOTPSchema,
  EnterPhoneNumberSchema,
} from '../schemas/seller-auth.schema';

const getMeSellerController = asyncErrorHandler(
  async (req: IRequest<unknown, unknown, unknown>, res: Response) => {
    const id = req.user!.id;

    const meResponse = await getSellerMeService(id);
    return res.status(200).json(meResponse);
  }
);

const phoneNumberVerificationRequest = asyncErrorHandler(
  async (
    req: IRequest<
      unknown,
      unknown,
      z.infer<typeof EnterPhoneNumberSchema>['body']
    >,
    res: Response
  ) => {
    const userId = req.user!.id;
    const phoneNumber = req.body.phone_number;
    await requestPhoneNumberConfirmation(userId, phoneNumber, req.user!.name);
    res.status(200).json({
      message: 'OTP sent successfully',
    });
  }
);

const getPhoneVerificationInfo = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const data = await getPhoneNumberVerificationInfoService(req.user!.id);
    return res.status(200).json({
      data: {
        ...data,
      },
    });
  }
);
const confirmPhoneNumber = asyncErrorHandler(
  async (
    req: IRequest<unknown, unknown, z.infer<typeof ConfirmOTPSchema>['body']>,
    res: Response
  ) => {
    await validatePhoneNumberOtp(
      req.user!.id,
      req.body.phone_number,
      req.body.otp
    );
    return res.status(200).json({
      message: 'Successfully confirmed phone number!',
    });
  }
);
export {
  getMeSellerController,
  phoneNumberVerificationRequest,
  getPhoneVerificationInfo,
  confirmPhoneNumber,
};
