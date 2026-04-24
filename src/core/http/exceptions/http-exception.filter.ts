import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainError } from '../../errors/domain-error';

type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const method: string = request?.method ?? 'UNKNOWN';
    const path: string = request?.url ?? 'UNKNOWN';

    if (exception instanceof DomainError) {
      const payload: ApiErrorBody = {
        code: exception.code,
        message: exception.message,
        fields: exception.fields,
        details: exception.details,
      };
      this.log(exception.statusCode, method, path, payload.code, payload.message, exception);
      return response.status(exception.statusCode).json(payload);
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      const normalized = this.normalizeHttpException(raw, statusCode);
      this.log(statusCode, method, path, normalized.code, normalized.message, exception);
      return response.status(statusCode).json(normalized);
    }

    const payload: ApiErrorBody = {
      code: 'INTERNAL_SERVER_ERROR',
      message: (exception as any)?.message ?? 'Unexpected error',
    };
    this.log(HttpStatus.INTERNAL_SERVER_ERROR, method, path, payload.code, payload.message, exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
  }

  private normalizeHttpException(raw: unknown, statusCode: number): ApiErrorBody {
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      const code = (r['code'] as string) ?? this.defaultCodeForStatus(statusCode);
      const message = Array.isArray(r['message'])
        ? (r['message'] as string[]).join(', ')
        : String(r['message'] ?? 'Request failed');
      return { code, message, fields: r['fields'] as any, details: r['details'] };
    }
    if (typeof raw === 'string') {
      return { code: this.defaultCodeForStatus(statusCode), message: raw };
    }
    return { code: this.defaultCodeForStatus(statusCode), message: 'Request failed' };
  }

  private defaultCodeForStatus(statusCode: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[statusCode] ?? 'HTTP_ERROR';
  }

  private log(statusCode: number, method: string, path: string, code: string, message: string, exception: unknown) {
    const line = `[${method}] ${path} -> ${statusCode} ${code}: ${message}`;
    if (statusCode >= 500) {
      this.logger.error(line, (exception as any)?.stack);
    } else {
      this.logger.warn(line);
    }
  }
}
