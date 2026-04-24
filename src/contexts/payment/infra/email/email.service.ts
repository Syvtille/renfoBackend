import { Inject, Injectable } from '@nestjs/common';
import { EmailServicePort, PaymentReceiptData } from '../../app/ports/email.service.port';
import { MAILER, MailerPort } from '../../../../core/mailer/mailer.port';
import { paymentReceiptHtml } from '../../../../core/mailer/templates/payment-receipt.template';

/**
 * Adapter: payment-context email port → core mailer.
 * Keeps the payment context decoupled from nodemailer while reusing the centralised mailer.
 */
@Injectable()
export class EmailService implements EmailServicePort {
  constructor(@Inject(MAILER) private readonly mailer: MailerPort) {}

  async sendPaymentReceipt(data: PaymentReceiptData): Promise<void> {
    await this.mailer.send({
      to: data.to,
      subject: `Confirmation de paiement — ${data.productName}`,
      html: paymentReceiptHtml({
        to: data.to,
        productName: data.productName,
        amountInCents: data.amountInCents,
        currency: data.currency,
        transactionId: data.transactionId,
        billingAddress: data.billingAddress,
        paymentDate: data.paymentDate,
      }),
    });
  }
}
