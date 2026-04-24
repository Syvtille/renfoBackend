import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER, MailerPort } from '../../../../core/mailer/mailer.port';
import { welcomeEmailHtml } from '../../../../core/mailer/templates/welcome.template';

@Injectable()
export class SendWelcomeEmailUseCase {
  private readonly logger = new Logger(SendWelcomeEmailUseCase.name);

  constructor(@Inject(MAILER) private readonly mailer: MailerPort) {}

  async execute(email: string, username: string): Promise<void> {
    try {
      await this.mailer.send({
        to: email,
        subject: 'Bienvenue sur ClashChat',
        html: welcomeEmailHtml(username),
      });
    } catch (e: any) {
      this.logger.warn(`Welcome email failed for ${email}: ${e?.message ?? e}`);
    }
  }
}
