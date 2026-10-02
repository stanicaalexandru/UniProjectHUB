import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentType } from './entities/document.entity';

// Campurile trimise impreuna cu fisierul (multipart/form-data, deci toate sunt text)
export class UploadDocumentDto {
  @IsUUID() projectId: string;
  @IsOptional() @IsUUID() milestoneId?: string;
  @IsOptional() @IsString() @MaxLength(300) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class UpdateDocumentDto {
  @IsOptional() @IsString() @MaxLength(300) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum(DocumentType) type?: DocumentType;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) tags?: string[];
}
