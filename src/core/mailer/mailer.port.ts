export const MAILER = Symbol('MAILER');

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export abstract class MailerPort {
  abstract send(message: MailMessage): Promise<void>;
}
