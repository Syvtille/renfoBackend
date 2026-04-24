import { IsString, IsNumber, IsOptional, IsIn, Min, MinLength, IsEmail, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class BillingAddressDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  line1: string;

  @IsString()
  @IsOptional()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  @Length(2, 2)
  country: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(50)
  priceInCents: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsOptional()
  features?: string[];

  @IsString()
  @IsOptional()
  badgeText?: string;

  @IsOptional()
  isPopular?: boolean;
}

export class PurchaseProductDto {
  @IsString()
  productId: string;

  @IsString()
  stripeCustomerId: string;

  @ValidateNested()
  @Type(() => BillingAddressDto)
  billing: BillingAddressDto;
}

export class CreateCustomerDto {
  @IsString()
  email: string;

  @IsString()
  name: string;
}

export class CreateSubscriptionDto {
  @IsString()
  customerId: string;

  @IsIn(['month', 'year'])
  plan: 'month' | 'year';

  @IsString()
  @IsOptional()
  promoCode?: string;
}

export class ChangePlanDto {
  @IsIn(['month', 'year'])
  plan: 'month' | 'year';
}
