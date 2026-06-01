import { Module } from '@nestjs/common';
import { VisaTypesModule } from '../visa-types/visa-types.module';
import { EligibilityService } from './eligibility.service';

@Module({
  imports: [VisaTypesModule],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
