import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
