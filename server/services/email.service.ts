/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || '';

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log(`[EmailService] Configured real SMTP Transporter (${smtpHost}:${smtpPort}) for user: ${smtpUser}`);
    } else {
      console.warn('[EmailService] ⚠️ SMTP_USER / SMTP_PASS not set in .env. Real email delivery via SMTP requires SMTP_USER and SMTP_PASS (e.g. Gmail App Password).');
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@modelverseindia.com';
      
      if (this.transporter) {
        console.log(`[EmailService] Dispatching SMTP email to: ${options.to}...`);
        const info = await this.transporter.sendMail({
          from: `"ModelVerse Security" <${from}>`,
          to: options.to,
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          html: options.html,
        });

        console.log(`[EmailService] Successfully dispatched email to ${options.to}. MessageId: ${info.messageId}`);
        return true;
      } else {
        console.log(`[EmailService] Notice: SMTP Transporter is not configured with real credentials.`);
      }
    } catch (err: any) {
      console.warn(`[EmailService] SMTP dispatch notice for ${options.to}:`, err?.message || err);
    }
    return false;
  }

  async sendOtpEmail(toEmail: string, otpCode: string, type: 'registration' | 'password_reset' = 'password_reset'): Promise<boolean> {
    console.log(`\n========================================================================`);
    console.log(`[SECURITY OTP DISPATCH] 🔑 6-Digit OTP Code for ${toEmail}: ${otpCode} (Type: ${type})`);
    console.log(`========================================================================\n`);

    const subject = type === 'registration'
      ? 'ModelVerse India - Your Email Verification Code (OTP)'
      : 'ModelVerse India - Password Reset Security Code (OTP)';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 15px;">
          <h1 style="color: #111111; margin: 0; font-size: 24px;">ModelVerse India</h1>
          <p style="color: #D4AF37; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 2px;">SECURE AUTHENTICATION</p>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 15px; color: #333333;">Hello,</p>
          <p style="font-size: 14px; color: #555555; line-height: 1.6;">
            Your official 6-digit security One-Time Password (OTP) for ${type === 'registration' ? 'account verification' : 'password reset'} is:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7e22ce; background-color: #f3e8ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #d8b4fe;">${otpCode}</span>
          </div>
          <p style="font-size: 13px; color: #666666; line-height: 1.5;">
            This OTP is valid for <strong>10 minutes</strong>. Please check your email inbox and enter this code manually on the ModelVerse portal to verify. Do not share this code with anyone.
          </p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 11px; color: #888888;">
          <p>&copy; ${new Date().getFullYear()} ModelVerse India. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html: htmlContent,
    });
  }
}

export const emailService = new EmailService();
