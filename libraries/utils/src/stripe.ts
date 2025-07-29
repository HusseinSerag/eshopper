import { Stripe } from 'stripe';

export class StripeClient {
  stripe: Stripe;
  public static readonly SUPPORTED_COUNTRIES = [
    'US',
    'CA',
    'GB',
    'AU',
    'NZ',
    'SG',
    'HK',
    'JP',
    'DE',
    'FR',
    'IT',
    'ES',
    'NL',
    'BE',
    'AT',
    'CH',
    'SE',
    'NO',
    'DK',
    'FI',
    'IE',
    'LU',
    'PT',
  ];
  constructor(secret: string) {
    this.stripe = new Stripe(secret, {
      apiVersion: '2025-06-30.basil',
    });
  }
  getInstance() {
    return this.stripe;
  }
}
