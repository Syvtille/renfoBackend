import { Global, Module } from '@nestjs/common';
import { MAILER, MailerPort } from './mailer.port';
import { NodemailerService } from './nodemailer.service';

@Global()
@Module({
  providers: [
    NodemailerService,
    { provide: MAILER, useExisting: NodemailerService },
    { provide: MailerPort, useExisting: NodemailerService },
  ],
  exports: [MAILER, MailerPort],
})
export class MailerModule {}
