import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own account (soft delete)' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.usersService.deleteAccount(userId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] List all users' })
  async adminListUsers(@Query() query: PaginationDto) {
    return this.usersService.adminListUsers({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
    });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Get user by ID' })
  async adminGetUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '[Admin] Update user role/status' })
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.usersService.adminUpdateUser(
      id,
      body as Parameters<UsersService['adminUpdateUser']>[1],
    );
  }
}
