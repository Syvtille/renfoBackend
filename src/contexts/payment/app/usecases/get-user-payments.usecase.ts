import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_REPOSITORY, PaymentRepositoryPort } from '../ports/payment.repository.port';

@Injectable()
export class GetUserPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
  ) {}

  async execute(userId: string) {
    return this.paymentRepo.findByUserId(userId);
  }
}
