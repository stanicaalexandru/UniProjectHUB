import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UploadedFile, UseInterceptors, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { appError } from '../common/errors';
import { UpdateDocumentDto, UploadDocumentDto } from './dto';

@ApiTags('documents') @ApiBearerAuth() @Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}
  @Get() findByProject(@Query('projectId') projectId: string, @Query('milestoneId') milestoneId: string, @CurrentUser() user: User) {
    if (milestoneId) return this.svc.findByMilestone(milestoneId, user);
    return this.svc.findByProject(projectId, user);
  }
  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.findOneFor(id, user); }
  @Post('upload') @UseInterceptors(FileInterceptor('file')) @ApiConsumes('multipart/form-data')
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadDocumentDto, @CurrentUser() user: User) { return this.svc.upload(file, dto, user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @CurrentUser() user: User) { return this.svc.update(id, dto, user); }
  @Delete(':id') remove(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.delete(id, user); }
  @Get(':id/versions') getVersions(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.getVersions(id, user); }

  @Get(':id/download') async download(@Param('id') id: string, @CurrentUser() user: User, @Res() res: Response) {
    const doc = await this.svc.findOneFor(id, user);
    const filePath = path.resolve(doc.storagePath);
    if (!fs.existsSync(filePath)) throw new NotFoundException(appError('FILE_NOT_FOUND'));
    // res.attachment codifica numele corect (ghilimele, diacritice), fara risc de header injection
    res.attachment(doc.originalName);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  }
}
