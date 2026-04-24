import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import { has } from './permission.utils';
import { AuthInsufficientPermissionsError } from '../../contexts/auth/domain/errors/auth.errors';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<bigint>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required === undefined) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.permissions) throw new AuthInsufficientPermissionsError();

    const userMask = BigInt(user.permissions);

    if (!has(userMask, required)) throw new AuthInsufficientPermissionsError();

    return true;
  }
}
