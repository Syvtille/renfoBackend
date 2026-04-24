import { DomainError } from '../../../../core/errors/domain-error';

export class AuthEmailAlreadyTakenError extends DomainError {
  constructor() {
    super({ code: 'AUTH_EMAIL_ALREADY_TAKEN', message: 'Email already taken', statusCode: 409, fields: { email: ['Email already taken'] } });
  }
}

export class AuthUsernameAlreadyTakenError extends DomainError {
  constructor() {
    super({ code: 'AUTH_USERNAME_ALREADY_TAKEN', message: 'Username already taken', statusCode: 409, fields: { username: ['Username already taken'] } });
  }
}

export class AuthInvalidCredentialsError extends DomainError {
  constructor() {
    super({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials', statusCode: 401, fields: { email: ['Invalid credentials'], password: ['Invalid credentials'] } });
  }
}

export class AuthAccountDisabledError extends DomainError {
  constructor() {
    super({ code: 'AUTH_ACCOUNT_DISABLED', message: 'Account is disabled', statusCode: 403 });
  }
}

export class AuthUserNotFoundError extends DomainError {
  constructor() {
    super({ code: 'AUTH_USER_NOT_FOUND', message: 'User not found', statusCode: 404 });
  }
}

export class AuthTokenInvalidError extends DomainError {
  constructor(reason?: string) {
    super({ code: 'AUTH_TOKEN_INVALID', message: reason ?? 'Refresh token invalide', statusCode: 401 });
  }
}

export class AuthTokenExpiredError extends DomainError {
  constructor() {
    super({ code: 'AUTH_TOKEN_EXPIRED', message: 'Refresh token expiré', statusCode: 401 });
  }
}

export class AuthTokenCompromisedError extends DomainError {
  constructor() {
    super({ code: 'AUTH_TOKEN_COMPROMISED', message: 'Refresh token compromis — session révoquée (Token Family)', statusCode: 401 });
  }
}

export class AuthSessionInvalidatedError extends DomainError {
  constructor() {
    super({ code: 'AUTH_SESSION_INVALIDATED', message: 'Session invalidée — reconnectez-vous', statusCode: 401 });
  }
}

export class AuthSuspiciousActivityError extends DomainError {
  constructor(message?: string) {
    super({ code: 'AUTH_SUSPICIOUS_ACTIVITY', message: message ?? 'Comportement suspect — session révoquée', statusCode: 403 });
  }
}

export class AuthMissingTokenError extends DomainError {
  constructor() {
    super({ code: 'AUTH_MISSING_TOKEN', message: 'Missing or invalid Authorization header', statusCode: 401 });
  }
}

export class AuthInvalidTokenError extends DomainError {
  constructor() {
    super({ code: 'AUTH_TOKEN_MALFORMED', message: 'Invalid or expired token', statusCode: 401 });
  }
}

export class AuthInsufficientPermissionsError extends DomainError {
  constructor() {
    super({ code: 'AUTH_INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions', statusCode: 403 });
  }
}
