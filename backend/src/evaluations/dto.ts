// Obiectele libere din liste au nevoie de @Type(() => Object): conversia implicita le-ar transforma in liste goale
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvaluationDto {
  @IsUUID() projectId: string;
  // Faza se verifica in serviciu (EVALUATION_PHASE_INVALID)
  @IsString() phase: string;
  // Criteriile sunt citite camp cu camp de serviciu (nume, descriere, punctaje)
  @IsOptional() @IsArray() @ArrayMaxSize(50) @Type(() => Object) @IsObject({ each: true }) criteria?: Record<string, unknown>[];
}

export class CompleteEvaluationDto {
  @IsOptional() @IsArray() @ArrayMaxSize(50) @Type(() => Object) @IsObject({ each: true }) criteria?: Record<string, unknown>[];
  @IsOptional() @IsString() @MaxLength(10000) generalFeedback?: string;
  @IsOptional() @IsString() @MaxLength(5000) strengths?: string;
  @IsOptional() @IsString() @MaxLength(5000) improvements?: string;
  // Obligatoriu doar pentru corectarea unei evaluari finalizate (CORRECTION_REASON_REQUIRED)
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}
