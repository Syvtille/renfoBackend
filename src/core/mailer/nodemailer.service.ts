import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailerPort, MailMessage } from './mailer.port';

@Injectable()
export class NodemailerService extends MailerPort implements OnModuleInit {
  private readonly logger = new Logger(NodemailerService.name);
  private transporter!: nodemailer.Transporter;
  private defaultFrom: string = '"ClashChat" <noreply@clashchat.dev>';
  private ready = false;

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      this.defaultFrom = process.env.EMAIL_FROM ?? `"ClashChat" <${process.env.SMTP_USER}>`;
      this.logger.log(`Mailer initialised (SMTP ${host})`);
      this.ready = true;
      return;
    }

    try {
      const account = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: account.user, pass: account.pass },
      });
      this.logger.log(`Mailer initialised (Ethereal dev inbox — user: ${account.user})`);
      this.ready = true;
    } catch (e: any) {
      this.logger.warn(`Mailer unavailable — falling back to log-only mode: ${e?.message ?? e}`);
      this.ready = false;
    }
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.ready) {
      this.logger.log(`[mail fallback] to=${message.to} subject="${message.subject}"`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: message.from ?? this.defaultFrom,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) this.logger.log(`Mail sent (preview: ${preview})`);
      else this.logger.log(`Mail sent to ${message.to}`);
    } catch (e: any) {
      this.logger.error(`Mail send failed: ${e?.message ?? e}`);
    }
  }
}
