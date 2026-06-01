import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const requestId =
      (request.headers['x-request-id'] as string) ?? randomUUID();
    request.requestId = requestId;

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} ${response.statusCode} +${duration}ms [${requestId}]`,
          );
        },
        error: () => {
          const duration = Date.now() - start;
          this.logger.warn(
            `${method} ${url} ERROR +${duration}ms [${requestId}]`,
          );
        },
      }),
    );
  }
}
