import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  ListApplicationsDto,
  UpdateApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';

type CurrentUserShape = {
  id: string;
  role?: string;
  emailVerified?: boolean;
};

@ApiTags('applications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'applications', version: '1' })
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  @ApiOperation({
    summary: 'List applications for current user or all for admins',
  })
  async listApplications(
    @CurrentUser() user: CurrentUserShape,
    @Query() query: ListApplicationsDto,
  ) {
    return this.applicationService.findAll({
      userId: user.id,
      role: user.role,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      destinationCountryId: query.destinationCountryId,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft visa application pending payment' })
  async createApplication(
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: CreateApplicationDto,
  ) {
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Verify your email before starting a visa application',
      );
    }

    return this.applicationService.create(user.id, dto);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get backend-derived application progress' })
  async getApplicationProgress(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserShape,
  ) {
    return this.applicationService.getProgress(id, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  async getApplication(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserShape,
  ) {
    return this.applicationService.findById(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application details' })
  async updateApplication(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationService.update(id, user.id, user.role, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Update application status' })
  async updateApplicationStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationService.updateStatus(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete application' })
  async deleteApplication(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserShape,
  ) {
    await this.applicationService.delete(id, user.id, user.role);
  }
}
