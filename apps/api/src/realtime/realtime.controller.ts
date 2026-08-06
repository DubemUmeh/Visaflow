import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RealtimeService } from './realtime.service';

@ApiTags('realtime')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'realtime', version: '1' })
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to realtime wallet/payment/application events' })
  events(@CurrentUser('id') userId: string): Observable<MessageEvent> {
    return this.realtimeService.stream(userId);
  }
}
