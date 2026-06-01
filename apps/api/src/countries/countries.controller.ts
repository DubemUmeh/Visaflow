import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('countries')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'countries', version: '1' })
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published countries (paginated)' })
  async listCountries(@Query() query: PaginationDto & { region?: string }) {
    return this.countriesService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      search: query.search,
      region: query.region,
      isPublished: true,
    });
  }

  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all countries (lightweight, for dropdowns)' })
  async getAllCountries() {
    return this.countriesService.findAllSimple();
  }

  @Public()
  @Get('regions')
  @ApiOperation({ summary: 'Get list of all regions' })
  async getRegions() {
    return this.countriesService.getRegions();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get country by slug' })
  async getCountry(@Param('slug') slug: string) {
    return this.countriesService.findBySlug(slug);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Create country' })
  async adminCreate(@Body() body: Record<string, unknown>) {
    return this.countriesService.adminCreate(
      body as Parameters<CountriesService['adminCreate']>[0],
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Update country' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.countriesService.adminUpdate(
      id,
      body as Parameters<CountriesService['adminUpdate']>[1],
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete country (soft delete)' })
  async adminDelete(@Param('id') id: string) {
    await this.countriesService.adminDelete(id);
  }
}
