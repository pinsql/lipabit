import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

  private get baseUrl() {
    const env = this.config.get('mpesa.environment');
    return env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const key = this.config.get('mpesa.consumerKey');
    const secret = this.config.get('mpesa.consumerSecret');
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          headers: { Authorization: `Basic ${credentials}` },
        }),
      );
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (parseInt(data.expires_in) - 60) * 1000;
      return this.accessToken!;
    } catch (err) {
      this.logger.error('Failed to get M-Pesa access token', err.message);
      throw new InternalServerErrorException('M-Pesa service unavailable');
    }
  }

  async initiateSTKPush(phone: string, amountKes: number, transactionId: string, description: string) {
    const token = await this.getAccessToken();
    const shortCode = this.config.get('mpesa.businessShortCode');
    const passkey = this.config.get('mpesa.passkey');
    const callbackUrl = `${this.config.get('mpesa.callbackBaseUrl')}/api/v1/mpesa/callback/stk`;

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const sanitizedPhone = phone.replace(/^\+/, '');

    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amountKes),
            PartyA: sanitizedPhone,
            PartyB: shortCode,
            PhoneNumber: sanitizedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `LIPABIT-${transactionId.slice(0, 8).toUpperCase()}`,
            TransactionDesc: description.slice(0, 100),
          },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      await this.prisma.mpesaTransaction.create({
        data: {
          transactionId,
          type: 'STK_PUSH',
          status: 'PENDING',
          phone,
          amountKes,
          merchantRequestId: data.MerchantRequestID,
          checkoutRequestId: data.CheckoutRequestID,
        },
      });

      return {
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
      };
    } catch (err) {
      this.logger.error('STK Push failed', err.response?.data || err.message);
      throw new BadRequestException('Failed to initiate M-Pesa payment');
    }
  }

  async handleSTKCallback(payload: any) {
    const body = payload.Body?.stkCallback;
    if (!body) return;

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    const mpesaTx = await this.prisma.mpesaTransaction.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
    });
    if (!mpesaTx) {
      this.logger.warn(`Unknown CheckoutRequestID: ${CheckoutRequestID}`);
      return;
    }

    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    let receiptNumber: string | undefined;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const receipt = CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber');
      receiptNumber = receipt?.Value;
    }

    // Idempotency: only act if still PENDING — prevents replay attacks
    const updated = await this.prisma.mpesaTransaction.updateMany({
      where: { id: mpesaTx.id, status: 'PENDING' },
      data: {
        status,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber: receiptNumber,
        completedAt: new Date(),
        callbackPayload: payload,
      },
    });

    if (updated.count === 0) {
      this.logger.warn(`Duplicate STK callback ignored for ${CheckoutRequestID}`);
      return null;
    }

    return { transactionId: mpesaTx.transactionId, status, receiptNumber };
  }

  async initiateB2C(phone: string, amountKes: number, transactionId: string, remarks: string) {
    const token = await this.getAccessToken();
    const callbackUrl = `${this.config.get('mpesa.callbackBaseUrl')}/api/v1/mpesa/callback/b2c`;
    const shortCode = this.config.get('mpesa.b2cShortCode');

    const sanitizedPhone = phone.replace(/^\+/, '');

    try {
      const { data } = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/mpesa/b2c/v3/paymentrequest`,
          {
            OriginatorConversationID: `LIPABIT-B2C-${transactionId.slice(0, 8)}`,
            InitiatorName: this.config.get('mpesa.b2cInitiatorName'),
            SecurityCredential: this.config.get('mpesa.b2cSecurityCredential'),
            CommandID: 'BusinessPayment',
            Amount: Math.floor(amountKes),
            PartyA: shortCode,
            PartyB: sanitizedPhone,
            Remarks: remarks.slice(0, 100),
            QueueTimeOutURL: `${callbackUrl}/timeout`,
            ResultURL: callbackUrl,
            Occasion: `LIPABIT-${transactionId.slice(0, 8).toUpperCase()}`,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      await this.prisma.mpesaTransaction.create({
        data: {
          transactionId,
          type: 'B2C',
          status: 'PENDING',
          phone,
          amountKes,
          conversationId: data.ConversationID,
          originatorConvId: data.OriginatorConversationID,
        },
      });

      return { conversationId: data.ConversationID };
    } catch (err) {
      this.logger.error('B2C payment failed', err.response?.data || err.message);
      throw new BadRequestException('Failed to initiate M-Pesa payout');
    }
  }

  async handleB2CCallback(payload: any) {
    const result = payload.Result;
    if (!result) return;

    const { ConversationID, ResultCode, ResultDesc, TransactionID } = result;

    const mpesaTx = await this.prisma.mpesaTransaction.findFirst({
      where: { conversationId: ConversationID },
    });
    if (!mpesaTx) return;

    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';

    // Idempotency: only act if still PENDING
    const updated = await this.prisma.mpesaTransaction.updateMany({
      where: { id: mpesaTx.id, status: 'PENDING' },
      data: {
        status,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber: TransactionID,
        completedAt: new Date(),
        callbackPayload: payload,
      },
    });

    if (updated.count === 0) {
      this.logger.warn(`Duplicate B2C callback ignored for ${ConversationID}`);
      return null;
    }

    return { transactionId: mpesaTx.transactionId, status };
  }

  async querySTKStatus(checkoutRequestId: string) {
    const token = await this.getAccessToken();
    const shortCode = this.config.get('mpesa.businessShortCode');
    const passkey = this.config.get('mpesa.passkey');
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        { BusinessShortCode: shortCode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
    return data;
  }
}
