import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response is already wrapped (has `data` key), don't double-wrap
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'timestamp' in data
        ) {
          return data;
        }
        return {
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
