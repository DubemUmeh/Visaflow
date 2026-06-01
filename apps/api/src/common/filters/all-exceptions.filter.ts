import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { RequestLike, ResponseLike } from '../types/http.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ResponseLike>();
    const request = ctx.getRequest<RequestLike>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string | string[]) ?? message;
        error = (res.error as string) ?? error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const requestId = request.headers['x-request-id'] as string;

    const errorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestId && { requestId }),
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${statusCode}: ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
