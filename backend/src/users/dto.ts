import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { UserRole, UserStatus } from './entities/user.entity';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(200) faculty?: string;
  @IsOptional() @IsString() @MaxLength(200) department?: string;
  @IsOptional() @IsInt() @Min(1) @Max(8) studyYear?: number;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsString() @MaxLength(30)
  @Matches(/^[\d\s+().-]*$/, { message: 'Numărul de telefon poate conține doar cifre, spații și + ( ) . -' })
  phone?: string;
  @IsOptional() @IsObject() notificationPreferences?: Record<string, boolean>;
  @IsOptional() @IsArray() @ArrayMaxSize(500) @IsUUID('all', { each: true }) favoriteProjects?: string[];
  // Doar administratorul le poate schimba (verificat in serviciu)
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}

export class DeleteAccountDto {
  @IsString() password: string;
}

export class SetPinDto {
  @IsString() currentPassword: string;
  @IsString() @Matches(/^\d{4,6}$/, { message: 'PIN-ul trebuie să aibă între 4 și 6 cifre' }) pin: string;
}

// Lungimea minima a parolei noi e verificata in serviciu (PASSWORD_TOO_SHORT)
export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MaxLength(128) newPassword: string;
}

export class AvatarDto {
  @IsString() avatar: string;
}

export class ForgotPasswordDto {
  @IsEmail() email: string;
}

export class ResetPasswordDto {
  @IsEmail() email: string;
  @IsString() code: string;
  @IsString() @MaxLength(128) newPassword: string;
}
