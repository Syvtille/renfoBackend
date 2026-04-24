import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { verifyCustomJwt } from './jwt.utils';
import { JWT_SECRET } from './jwt.constants';
import { AuthMissingTokenError, AuthInvalidTokenError } from '../../contexts/auth/domain/errors/auth.errors';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthMissingTokenError();
    }

    const token = authHeader.slice(7);

    try {
      const payload = verifyCustomJwt(token, JWT_SECRET);
      (request as any).user = {
        userId: payload.sub,
        username: payload.username,
        permissions: payload.permissions,
      };
      return true;
    } catch {
      throw new AuthInvalidTokenError();
    }
  }
}
