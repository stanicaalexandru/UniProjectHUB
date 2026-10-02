import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { Milestone } from '../projects/entities/milestone.entity';
import { User } from '../users/entities/user.entity';
import { ProjectAccessService, PROJECT_MANAGERS, pick } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';
import { UpdateDocumentDto, UploadDocumentDto } from './dto';

const DOC_FIELDS = ['name', 'description', 'type', 'tags'] as const;

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(DocumentVersion) private versionRepo: Repository<DocumentVersion>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
  ) {}

  async findByProject(projectId: string, user: User) {
    await this.access.assertProject(user, projectId);
    return this.docRepo.find({ where: { projectId }, relations: ['uploadedBy', 'versions'], order: { createdAt: 'DESC' } });
  }

  async findByMilestone(milestoneId: string, user: User) {
    const ms = await this.milestoneRepo.findOne({ where: { id: milestoneId } });
    if (!ms) throw new NotFoundException(appError('MILESTONE_NOT_FOUND'));
    await this.access.assertProject(user, ms.projectId);
    return this.docRepo.find({ where: { milestoneId }, relations: ['uploadedBy'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const d = await this.docRepo.findOne({ where: { id }, relations: ['uploadedBy', 'versions'] });
    if (!d) throw new NotFoundException(appError('DOCUMENT_NOT_FOUND'));
    return d;
  }

  async findOneFor(id: string, user: User) {
    const d = await this.findOne(id);
    await this.access.assertProject(user, d.projectId);
    return d;
  }

  async upload(file: Express.Multer.File, dto: UploadDocumentDto, user: User) {
    if (!file) throw new BadRequestException(appError('FILE_TYPE_NOT_ALLOWED'));
    try {
      await this.access.assertProject(user, dto?.projectId);
      if (dto.milestoneId) {
        const ms = await this.milestoneRepo.findOne({ where: { id: dto.milestoneId } });
        if (!ms || ms.projectId !== dto.projectId) throw new BadRequestException(appError('MILESTONE_OTHER_PROJECT'));
      }
    } catch (e) {
      fs.promises.unlink(file.path).catch(() => {}); // fisierul a ajuns deja pe disc: il stergem daca cererea e respinsa
      throw e;
    }
    const doc = this.docRepo.create({
      name: dto.name || file.originalname, projectId: dto.projectId, milestoneId: dto.milestoneId, description: dto.description,
      filename: file.filename, originalName: file.originalname, mimeType: file.mimetype,
      size: file.size, storagePath: file.path, uploadedById: user.id, currentVersion: 1,
    });
    const saved = await this.docRepo.save(doc);
    await this.versionRepo.save(this.versionRepo.create({ documentId: saved.id, version: 1, filename: file.filename, storagePath: file.path, size: file.size, uploadedById: user.id }));
    const { coordinatorId, memberIds } = await this.access.audience(dto.projectId);
    await this.notifications.notify([coordinatorId, ...memberIds], { type: NotificationType.INFO, title: 'Document nou',
      message: `${user.firstName} ${user.lastName} a adaugat documentul "${saved.name}".`,
      actionUrl: `/projects/${dto.projectId}`, entityType: 'document', entityId: saved.id }, { exclude: user.id });
    return saved;
  }

  async update(id: string, input: UpdateDocumentDto, user: User) {
    await this.findOneFor(id, user);
    const dto = pick<Document>(input, DOC_FIELDS);
    if (Object.keys(dto).length) await this.docRepo.update(id, dto);
    return this.findOne(id);
  }

  // Poate sterge cine a incarcat documentul, coordonatorul proiectului sau adminul
  async delete(id: string, user: User) {
    const doc = await this.findOne(id);
    const { role } = await this.access.assertProject(user, doc.projectId);
    if (doc.uploadedById !== user.id && !PROJECT_MANAGERS.includes(role)) {
      throw new ForbiddenException(appError('DOCUMENT_DELETE_OWN_ONLY'));
    }
    const versions = await this.versionRepo.find({ where: { documentId: id } });
    await this.versionRepo.delete({ documentId: id });
    await this.docRepo.delete(id);
    // Stergem si fisierele de pe disc, altfel raman orfane (cu date personale) dupa stergerea din baza de date
    const paths = new Set([doc.storagePath, ...versions.map((v) => v.storagePath)].filter(Boolean));
    await Promise.all([...paths].map((p) => fs.promises.unlink(p).catch(() => {})));
  }

  async getVersions(id: string, user: User) {
    await this.findOneFor(id, user);
    return this.versionRepo.find({ where: { documentId: id }, order: { version: 'DESC' } });
  }
}
