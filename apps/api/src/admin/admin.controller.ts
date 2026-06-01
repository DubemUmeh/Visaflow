import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { UpdateSettingsDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Admin analytics overview' })
  async analytics() {
    return this.adminService.analytics();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.adminService.updateSettings(userId, dto);
  }
}
