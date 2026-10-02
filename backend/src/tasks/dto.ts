import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TaskPriority } from './entities/task.entity';

export class TaskDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  // Starea se verifica in serviciu (mesaj STATUS_INVALID)
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() milestoneId?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) estimatedHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) loggedHours?: number;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) tags?: string[];
}

export class TaskStatusDto {
  @IsString() status: string;
}
