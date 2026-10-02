import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class TeamDto {
  // Numele gol e respins in serviciu (TEAM_NAME_REQUIRED)
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) avatar?: string;
  @IsOptional() @IsInt() @Min(2) @Max(20) maxMembers?: number;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsString() @MaxLength(200) faculty?: string;
  @IsOptional() @IsString() @MaxLength(200) department?: string;
}

export class AddMemberDto {
  @IsUUID() userId: string;
}

export class InviteDto {
  @IsEmail() email: string;
}

export class JoinRequestDto {
  @IsOptional() @IsString() @MaxLength(1000) message?: string;
}

export class RespondDto {
  @IsBoolean() accept: boolean;
}
