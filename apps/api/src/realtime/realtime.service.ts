import { Injectable } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';

export type RealtimeEvent = {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

@Injectable()
export class RealtimeService {
  private readonly events$ = new Subject<RealtimeEvent>();

  emit(userId: string, type: string, payload: Record<string, unknown>) {
    this.events$.next({ userId, type, payload, createdAt: new Date().toISOString() });
  }

  stream(userId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => event.userId === userId),
      map((event) => ({ data: event }) as MessageEvent),
    );
  }
}
