import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/jwt/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/permissions/permissions.guard';
import { RequirePermissions } from '../../../shared/permissions/require-permissions.decorator';
import { ADMIN_ALL } from '../../../shared/permissions/permission.constants';
import { CreateProductUseCase } from '../app/usecases/create-product.usecase';
import { ListProductsUseCase } from '../app/usecases/list-products.usecase';
import { PurchaseProductUseCase } from '../app/usecases/purchase-product.usecase';
import { CreateCustomerUseCase } from '../app/usecases/create-customer.usecase';
import { CreateSubscriptionUseCase } from '../app/usecases/create-subscription.usecase';
import { CancelSubscriptionUseCase } from '../app/usecases/cancel-subscription.usecase';
import { ChangePlanUseCase } from '../app/usecases/change-plan.usecase';
import { GetInvoicesUseCase } from '../app/usecases/get-invoices.usecase';
import { GetUserSubscriptionUseCase } from '../app/usecases/get-user-subscription.usecase';
import { GetUserPaymentsUseCase } from '../app/usecases/get-user-payments.usecase';
import { SyncStripeProductsUseCase } from '../app/usecases/sync-stripe-products.usecase';
import {
  CreateProductDto,
  PurchaseProductDto,
  CreateCustomerDto,
  CreateSubscriptionDto,
  ChangePlanDto,
} from './dto/payment.dto';
import { PlanInterval } from '../domain/enums/plan-interval.enum';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly purchaseProduct: PurchaseProductUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly createSubscription: CreateSubscriptionUseCase,
    private readonly cancelSubscription: CancelSubscriptionUseCase,
    private readonly changePlan: ChangePlanUseCase,
    private readonly getInvoices: GetInvoicesUseCase,
    private readonly getUserSubscription: GetUserSubscriptionUseCase,
    private readonly getUserPayments: GetUserPaymentsUseCase,
    private readonly syncStripeProducts: SyncStripeProductsUseCase,
  ) {}

  /** Créer un produit one-shot (admin only) */
  @Post('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(ADMIN_ALL)
  createNewProduct(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto.name, dto.description, dto.priceInCents, dto.currency ?? 'eur');
  }

  /** Lister les produits disponibles */
  @Get('products')
  @UseGuards(JwtAuthGuard)
  listAvailableProducts() {
    return this.listProducts.execute();
  }

  /** Créer un customer Stripe */
  @Post('customers')
  @UseGuards(JwtAuthGuard)
  async createStripeCustomer(@Body() dto: CreateCustomerDto) {
    const customerId = await this.createCustomer.execute(dto.email, dto.name);
    return { customerId };
  }

  /** Synchroniser les produits depuis Stripe (admin only) */
  @Post('products/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(ADMIN_ALL)
  syncProducts() {
    return this.syncStripeProducts.execute();
  }

  /** Acheter un produit one-shot — retourne le clientSecret pour le formulaire */
  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  purchase(@Req() req: any, @Body() dto: PurchaseProductDto) {
    const userId = req.user.userId;
    return this.purchaseProduct.execute(userId, dto.productId, dto.stripeCustomerId, dto.billing);
  }

  /** Souscrire à un abonnement */
  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  subscribe(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    const userId = req.user.userId;
    return this.createSubscription.execute(userId, dto.customerId, dto.plan as PlanInterval, dto.promoCode);
  }

  /** Annuler son abonnement (fin de période) */
  @Post('subscriptions/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Req() req: any) {
    const userId = req.user.userId;
    return this.cancelSubscription.execute(userId);
  }

  /** Changer de plan (monthly <-> yearly) */
  @Put('subscriptions/plan')
  @UseGuards(JwtAuthGuard)
  changeSubscriptionPlan(@Req() req: any, @Body() dto: ChangePlanDto) {
    const userId = req.user.userId;
    return this.changePlan.execute(userId, dto.plan as PlanInterval);
  }

  /** Récupérer son abonnement actuel */
  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  getMySubscription(@Req() req: any) {
    const userId = req.user.userId;
    return this.getUserSubscription.execute(userId);
  }

  /** Récupérer ses factures */
  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  getMyInvoices(@Req() req: any) {
    const userId = req.user.userId;
    return this.getInvoices.execute(userId);
  }

  /** Récupérer son historique de paiements */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getMyPayments(@Req() req: any) {
    const userId = req.user.userId;
    return this.getUserPayments.execute(userId);
  }
}
