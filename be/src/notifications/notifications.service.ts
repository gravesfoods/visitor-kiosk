// be/src/notifications/notifications.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';

export interface HostNotificationPayload {
  visitor_name: string;
  host_email: string;
  host_name: string;
  reason: string;
  check_in_time: string; // formatted string from FE (e.g. "01/27/2026, 2:15 PM")
  photo_data_url?: string; // ✅ base64 data URL from kiosk (optional)
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private transporter: Transporter | null = null;
  private resend: Resend | null = null;

  private readonly fromEmail: string;
  private readonly resendFrom: string;

  constructor(private cfg: ConfigService) {
    this.fromEmail = (this.cfg.get<string>('FROM_EMAIL') || '').trim();
    this.resendFrom = (this.cfg.get<string>('RESEND_FROM') || '').trim();

    this.initEmailProviders();
  }

  private initEmailProviders() {
    const smtpHost = (this.cfg.get<string>('SMTP_SERVER') || '').trim();
    const smtpPortRaw = this.cfg.get<string>('SMTP_PORT') || '587';
    const smtpPort = Number(smtpPortRaw);
    const smtpUser = (this.cfg.get<string>('EMAIL_USERNAME') || '').trim();
    const smtpPass = (this.cfg.get<string>('EMAIL_PASSWORD') || '').trim();

    const resendKey = (this.cfg.get<string>('RESEND_API_KEY') || '').trim();

    const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);

    if (hasSmtp) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log(`Email provider: SMTP (${smtpHost}:${smtpPort})`);
      return;
    }

    if (resendKey) {
      this.resend = new Resend(resendKey);
      this.logger.log('Email provider: Resend');
      return;
    }

    this.logger.warn(
      'No email provider configured. Set SMTP_SERVER/SMTP_PORT/EMAIL_USERNAME/EMAIL_PASSWORD or RESEND_API_KEY.',
    );
  }

  /**
   * IMPORTANT:
   * - SMTP (SES) should use FROM_EMAIL (SES-verified identity)
   * - Resend can use RESEND_FROM
   */
  private resolveFrom(provider: 'smtp' | 'resend'): string {
    if (provider === 'smtp') {
      return this.fromEmail || 'noreply@example.com';
    }
    return this.resendFrom || this.fromEmail || 'noreply@example.com';
  }

  private buildHostEmailHtml(data: HostNotificationPayload, includePhoto: boolean): string {
    const brand = '#ec1f27'; // ✅ red

    const photoBlock = includePhoto
      ? `
        <div class="photo-wrap">
          <div class="photo-label">Visitor Photo</div>
          <img class="photo" src="cid:visitor_photo" alt="Visitor photo" />
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="color-scheme" content="light only">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #ffffff; }
          .container { max-width: 560px; margin: 0 auto; padding: 18px; }
          .header { background: ${brand}; color: white; padding: 18px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 18px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; }
          .visitor-name { font-size: 22px; font-weight: 800; margin: 10px 0; }
          .detail { margin: 10px 0; }
          .label { font-weight: 700; color: #666; }
          .value { color: #111; }
          .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #999; }
          .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; background: rgba(236,31,39,0.12); color: ${brand}; font-weight: 700; font-size: 12px; }
          .photo-wrap { margin-top: 16px; }
          .photo-label { font-size: 12px; font-weight: 800; color: #666; margin-bottom: 6px; }
          .photo { width: 100%; max-width: 520px; border-radius: 12px; border: 1px solid #e5e5e5; display: block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="pill">Visitor Check-In</div>
            <h1 style="margin:10px 0 0; font-size: 18px;">📋 Visitor Arrival</h1>
          </div>

          <div class="content">
            <p>Hello ${this.escapeHtml(data.host_name)},</p>
            <p>You have a visitor waiting at reception:</p>

            <div class="visitor-name">${this.escapeHtml(data.visitor_name)}</div>

            <div class="detail">
              <span class="label">Reason for visit:</span>
              <span class="value">${this.escapeHtml(data.reason)}</span>
            </div>

            <div class="detail">
              <span class="label">Checked in at:</span>
              <span class="value">${this.escapeHtml(data.check_in_time)}</span>
            </div>

            ${photoBlock}

            <p style="margin-top: 18px;">Please head to reception to greet your visitor.</p>
          </div>

          <div class="footer">
            Sent by Visitor Check-In System
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(input: string) {
    return (input || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private parseDataUrlImage(dataUrl?: string): { buffer: Buffer; mime: string; ext: string } | null {
    if (!dataUrl) return null;

    // Expected: data:image/jpeg;base64,....
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;

    const mime = match[1].toLowerCase();
    const b64 = match[2];

    const buffer = Buffer.from(b64, 'base64');

    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

    return { buffer, mime, ext };
  }

  async sendHostNotification(payload: HostNotificationPayload): Promise<{ success: true }> {
    if (!payload?.host_email) return { success: true };

    const subject = `Visitor Arrival: ${payload.visitor_name}`;

    const photo = this.parseDataUrlImage(payload.photo_data_url);
    const includePhoto = !!photo;

    // Prefer SMTP if configured
    if (this.transporter) {
      const from = this.resolveFrom('smtp');
      const html = this.buildHostEmailHtml(payload, includePhoto);

      try {
        const attachments = includePhoto
          ? [
              {
                filename: `visitor_photo.${photo!.ext}`,
                content: photo!.buffer,
                contentType: photo!.mime,
                cid: 'visitor_photo', // ✅ matches HTML src="cid:visitor_photo"
              },
            ]
          : [];

        const info = await this.transporter.sendMail({
          from, // ✅ SES-verified identity
          to: payload.host_email,
          subject,
          html,
          attachments,
        });

        this.logger.log(`SMTP email sent -> ${payload.host_email} (messageId=${info.messageId})`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`SMTP send failed -> ${payload.host_email}`, err?.stack || err);
        throw err;
      }
    }

    // Fallback to Resend
    if (this.resend) {
      const from = this.resolveFrom('resend');

      // Resend generally accepts data URL images inline fine, but CID attachments can be inconsistent across providers.
      // We'll embed as data URL for Resend; if too large, it may fail, but kiosk photos should be manageable.
      const html = includePhoto
        ? this.buildHostEmailHtml(payload, false).replace(
            '</div>\n\n            <p style="margin-top: 18px;">',
            `
            <div class="photo-wrap">
              <div class="photo-label">Visitor Photo</div>
              <img class="photo" src="${payload.photo_data_url}" alt="Visitor photo" />
            </div>
            </div>

            <p style="margin-top: 18px;">`,
          )
        : this.buildHostEmailHtml(payload, false);

      try {
        const res = await this.resend.emails.send({
          from,
          to: [payload.host_email],
          subject,
          html,
        });

        this.logger.log(`Resend email sent -> ${payload.host_email} (id=${(res as any)?.id || 'n/a'})`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`Resend send failed -> ${payload.host_email}`, err?.stack || err);
        throw err;
      }
    }

    this.logger.warn('sendHostNotification called but no email provider is configured.');
    throw new Error('Email provider not configured');
  }
}
