import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ConfirmUploadDto,
  ListDocumentsDto,
  RequestUploadUrlDto,
  ReviewDocumentDto,
} from './dto/document.dto';
import { DocumentsService } from './documents.service';

type CurrentUserShape = { id: string; role?: string };

@ApiTags('documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Create document metadata and upload URL' })
  async requestUploadUrl(
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.documentsService.requestUploadUrl(user.id, user.role, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a document upload' })
  async confirmUpload(@CurrentUser() user: CurrentUserShape, @Body() dto: ConfirmUploadDto) {
    return this.documentsService.confirmUpload(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async listDocuments(@CurrentUser() user: CurrentUserShape, @Query() query: ListDocumentsDto) {
    return this.documentsService.findAll(user.id, user.role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(@CurrentUser() user: CurrentUserShape, @Param('id') id: string) {
    return this.documentsService.findById(id, user.id, user.role);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: '[Admin] Review document' })
  async reviewDocument(
    @CurrentUser() user: CurrentUserShape,
    @Param('id') id: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.documentsService.review(id, user.id, user.role, dto);
  }
}
