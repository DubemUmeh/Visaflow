import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VisaTypesService } from './visa-types.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class VisaTypeQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  destinationCountryId?: string;

  @IsOptional()
  @IsString()
  destinationCountryCode?: string;

  @IsOptional()
  @IsUUID()
  nationalityCountryId?: string;

  @IsOptional()
  @IsString()
  nationalityCountryCode?: string;
}

@ApiTags('visa-types')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'visa-types', version: '1' })
export class VisaTypesController {
  constructor(private readonly visaTypesService: VisaTypesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List visa types (optionally filtered by country)' })
  async listVisaTypes(@Query() query: VisaTypeQueryDto) {
    return this.visaTypesService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      destinationCountryId: query.destinationCountryId,
      destinationCountryCode: query.destinationCountryCode,
      nationalityCountryId: query.nationalityCountryId,
      nationalityCountryCode: query.nationalityCountryCode,
      isPublished: true,
    });
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get visa type by slug' })
  async getVisaType(@Param('slug') slug: string) {
    return this.visaTypesService.findBySlug(slug);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Create visa type' })
  async adminCreate(@Body() body: Record<string, unknown>) {
    return this.visaTypesService.adminCreate(
      body as Parameters<VisaTypesService['adminCreate']>[0],
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Update visa type' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.visaTypesService.adminUpdate(
      id,
      body as Parameters<VisaTypesService['adminUpdate']>[1],
    );
  }
}
