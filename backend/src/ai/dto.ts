import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

// Indicatorii proiectului calculati de interfata; pe baza lor se salveaza scorul in istoricul proiectului
export class AnalyzeDto {
  @IsOptional() @IsNumber() @Min(0) @Max(100) progress?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) score?: number;
  @IsOptional() @IsNumber() @Min(0) documentCount?: number;
  @IsOptional() @IsNumber() @Min(0) recentActivity?: number;
  @IsOptional() @IsNumber() @Min(0) completedMilestones?: number;
  @IsOptional() @IsNumber() @Min(0) totalTasks?: number;
  @IsOptional() @IsNumber() @Min(0) completedTasks?: number;
  @IsOptional() @IsNumber() @Min(0) openTasks?: number;
  @IsOptional() @IsNumber() @Min(0) daysElapsed?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
