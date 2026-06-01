import { Module } from '@nestjs/common';
import { VisaTypesModule } from '../visa-types/visa-types.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [VisaTypesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
