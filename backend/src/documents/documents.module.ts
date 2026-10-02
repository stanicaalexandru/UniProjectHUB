import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { Milestone } from '../projects/entities/milestone.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { isAllowedUpload } from '../common/uploads';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion, Milestone]),
    // Limita de marime din .env (MAX_FILE_SIZE, implicit 50 MB) si doar tipurile de fisiere permise
    MulterModule.register({
      dest: process.env.UPLOAD_DIR || './uploads',
      limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => cb(null, isAllowedUpload(file)),
    }),
  ],
  providers: [DocumentsService], controllers: [DocumentsController], exports: [DocumentsService],
})
export class DocumentsModule {}
