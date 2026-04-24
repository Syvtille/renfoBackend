import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './infra/entities/product.entity';
import { PaymentEntity } from './infra/entities/payment.entity';
import { SubscriptionEntity } from './infra/entities/subscription.entity';
import { ProductRepository } from './infra/repositories/product.repository';
import { PaymentRepository } from './infra/repositories/payment.repository';
import { SubscriptionRepository } from './infra/repositories/subscription.repository';
import { StripeService } from './infra/stripe/stripe.service';
import { PRODUCT_REPOSITORY } from './app/ports/product.repository.port';
import { PAYMENT_REPOSITORY } from './app/ports/payment.repository.port';
import { SUBSCRIPTION_REPOSITORY } from './app/ports/subscription.repository.port';
import { STRIPE_SERVICE } from './app/ports/stripe.service.port';
import { CreateProductUseCase } from './app/usecases/create-product.usecase';
import { ListProductsUseCase } from './app/usecases/list-products.usecase';
import { PurchaseProductUseCase } from './app/usecases/purchase-product.usecase';
import { CreateCustomerUseCase } from './app/usecases/create-customer.usecase';
import { CreateSubscriptionUseCase } from './app/usecases/create-subscription.usecase';
import { CancelSubscriptionUseCase } from './app/usecases/cancel-subscription.usecase';
import { ChangePlanUseCase } from './app/usecases/change-plan.usecase';
import { GetInvoicesUseCase } from './app/usecases/get-invoices.usecase';
import { GetUserSubscriptionUseCase } from './app/usecases/get-user-subscription.usecase';
import { GetUserPaymentsUseCase } from './app/usecases/get-user-payments.usecase';
import { HandleWebhookUseCase } from './app/usecases/handle-webhook.usecase';
import { SyncStripeProductsUseCase } from './app/usecases/sync-stripe-products.usecase';
import { SendPaymentReceiptUseCase } from './app/usecases/send-payment-receipt.usecase';
import { EmailService } from './infra/email/email.service';
import { EMAIL_SERVICE } from './app/ports/email.service.port';
import { PaymentController } from './api/payment.controller';
import { WebhookController } from './api/webhook.controller';
import { JwtAuthGuard } from '../../shared/jwt/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, PaymentEntity, SubscriptionEntity]),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository },
    { provide: SUBSCRIPTION_REPOSITORY, useClass: SubscriptionRepository },
    { provide: STRIPE_SERVICE, useClass: StripeService },
    CreateProductUseCase,
    ListProductsUseCase,
    PurchaseProductUseCase,
    CreateCustomerUseCase,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    ChangePlanUseCase,
    GetInvoicesUseCase,
    GetUserSubscriptionUseCase,
    GetUserPaymentsUseCase,
    HandleWebhookUseCase,
    SyncStripeProductsUseCase,
    SendPaymentReceiptUseCase,
    { provide: EMAIL_SERVICE, useClass: EmailService },
    JwtAuthGuard,
  ],
})
export class PaymentModule {}
