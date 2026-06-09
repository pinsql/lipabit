import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(config.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  private get fromAddress() {
    return `LipaBit <${this.config.get('SMTP_FROM') || 'noreply@lipabit.com'}>`;
  }

  async sendEmailVerification(email: string, name: string, token: string) {
    const frontendUrl = this.config.get('app.frontendUrl') || 'http://localhost:3000';
    const link = `${frontendUrl}/verify-email?token=${token}`;

    await this.send(email, 'Verify your LipaBit email', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#F7931A">Welcome to LipaBit, ${name}!</h2>
        <p>Click the button below to verify your email address and activate your account.</p>
        <a href="${link}" style="display:inline-block;background:#F7931A;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Verify Email</a>
        <p style="color:#666;font-size:12px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `);
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const frontendUrl = this.config.get('app.frontendUrl') || 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send(email, 'Reset your LipaBit password', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#F7931A">Password Reset</h2>
        <p>Hi ${name}, you requested to reset your LipaBit password.</p>
        <a href="${link}" style="display:inline-block;background:#F7931A;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:12px">Link expires in 1 hour. If you didn't request this, please secure your account.</p>
      </div>
    `);
  }

  async sendTransactionConfirmation(
    email: string,
    name: string,
    type: string,
    reference: string,
    amountKes: number,
    amountSats: number,
  ) {
    const action = type === 'BUY_BTC' ? 'Bitcoin Purchase' : 'Bitcoin Sale';
    await this.send(email, `LipaBit: ${action} Confirmed`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#F7931A">Transaction Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your ${action.toLowerCase()} has been processed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #eee">Reference</td><td style="padding:8px;border:1px solid #eee"><b>${reference}</b></td></tr>
          <tr><td style="padding:8px;border:1px solid #eee">Amount (KES)</td><td style="padding:8px;border:1px solid #eee"><b>KES ${amountKes.toLocaleString()}</b></td></tr>
          <tr><td style="padding:8px;border:1px solid #eee">Bitcoin (sats)</td><td style="padding:8px;border:1px solid #eee"><b>${amountSats.toLocaleString()} sats</b></td></tr>
        </table>
        <p style="color:#666;font-size:12px">Keep this email for your records.</p>
      </div>
    `);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }
}
