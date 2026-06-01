import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiAutofillDto, AiRequirementSummaryDto, ChatMessageDto } from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('autofill-applicant')
  @ApiOperation({ summary: 'Extract applicant fields from free-form text' })
  async autofillApplicant(@Body() dto: AiAutofillDto) {
    return this.aiService.autofillApplicant(dto);
  }

  @Post('requirement-summary')
  @ApiOperation({ summary: 'Summarize visa requirements' })
  async requirementSummary(@Body() dto: AiRequirementSummaryDto) {
    return this.aiService.requirementSummary(dto);
  }

  @Post('chat')
  @ApiOperation({ summary: 'VisaFlow AI chat response' })
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiService.chat(dto);
  }
}
