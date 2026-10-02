import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ProjectPriority, ProjectStatus, ProjectType } from './entities/project.entity';
import { MilestoneStatus } from './entities/milestone.entity';

// Forma datelor primite de la client. Regulile de acces (cine ce camp poate modifica)
// raman in ProjectsService, care pastreaza doar campurile permise rolului.

const URL_OPTIONS = { require_protocol: true };
const notEmpty = (_: object, v: unknown) => v !== '';

// Campurile comune crearii si editarii
class ProjectFieldsDto {
  @IsOptional() @IsString() @MaxLength(5000) objectives?: string;
  @IsOptional() @IsEnum(ProjectType) type?: ProjectType;
  @IsOptional() @IsEnum(ProjectPriority) priority?: ProjectPriority;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() @MaxLength(200) faculty?: string;
  @IsOptional() @IsString() @MaxLength(200) department?: string;
  @IsOptional() @IsInt() @Min(2000) @Max(2100) academicYear?: number;
  @IsOptional() @ValidateIf(notEmpty) @IsUrl(URL_OPTIONS) @MaxLength(500) repository?: string;
  @IsOptional() @ValidateIf(notEmpty) @IsUrl(URL_OPTIONS) @MaxLength(500) demoUrl?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(60, { each: true }) tags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(60, { each: true }) technologies?: string[];
  @IsOptional() @IsUUID() coordinatorId?: string;
  @IsOptional() @IsUUID() teamId?: string;
}

export class CreateProjectDto extends ProjectFieldsDto {
  @IsString() @MaxLength(300) title: string;
  @IsString() @MaxLength(20000) description: string;
}

export class UpdateProjectDto extends ProjectFieldsDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  // Doar coordonatorul sau administratorul le pot schimba (verificat in serviciu)
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsNumber() @Min(1) @Max(10) finalGrade?: number;
  @IsOptional() @IsString() @MaxLength(2000) rejectionReason?: string;
}

export class MilestoneDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(MilestoneStatus) status?: MilestoneStatus;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) progressPercentage?: number;
  @IsOptional() @IsString() @MaxLength(2000) deliverables?: string;
}

export class CommentDto {
  // Comentariul gol e respins in serviciu, cu mesajul COMMENT_EMPTY
  @IsString() @MaxLength(5000) content: string;
}
