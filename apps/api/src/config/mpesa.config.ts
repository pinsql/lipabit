import { registerAs } from '@nestjs/config';

export default registerAs('mpesa', () => ({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
  passkey: process.env.MPESA_PASSKEY,
  callbackBaseUrl: process.env.MPESA_CALLBACK_BASE_URL,
  b2cInitiatorName: process.env.MPESA_B2C_INITIATOR_NAME,
  b2cSecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
  b2cShortCode: process.env.MPESA_B2C_SHORT_CODE,
  environment: process.env.MPESA_ENV || 'sandbox',
}));
