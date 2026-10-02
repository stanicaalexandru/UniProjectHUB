import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { toSelfView } from '../users/user-view';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Length, Equals, IsIn, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// Limite stricte pe IP pentru rutele de autentificare (pe langa limita globala):
// login/inregistrare - 20 pe minut; rutele cu coduri de 6 cifre - 5 pe minut
const AUTH_LIMIT = { default: { limit: 20, ttl: 60_000 } };
const CODE_LIMIT = { default: { limit: 5, ttl: 60_000 } };

class RegisterDto {
  @IsString() @MaxLength(100) firstName: string;
  @IsString() @MaxLength(100) lastName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
  // Doar student sau profesor; "admin" nu se poate alege la inregistrare
  @IsOptional() @IsIn([UserRole.STUDENT, UserRole.PROFESSOR], { message: 'Rolul poate fi doar student sau profesor' }) role?: UserRole;
  @IsOptional() @IsString() @MaxLength(200) faculty?: string;
  @IsOptional() @IsString() @MaxLength(200) department?: string;
  // Citim valoarea bruta din obj: conversia implicita ar transforma stringul "false" in true
  @Transform(({ obj }) => obj.acceptedTerms === true)
  @Equals(true, { message: 'Trebuie să accepți Termenii și Politica de confidențialitate' })
  acceptedTerms: boolean;
}
class LoginDto {
  @IsEmail() email: string;
  @IsString() @MaxLength(128) password: string;
}
class VerifyEmailDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 6) code: string;
}
class EmailDto {
  @IsEmail() email: string;
}
class LoginPinDto {
  @IsString() pinToken: string;
  @IsString() @Matches(/^\d{4,6}$/, { message: 'PIN-ul are între 4 și 6 cifre' }) pin: string;
}
class RefreshDto {
  @IsString() refreshToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  @Public()
  @Throttle(CODE_LIMIT)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm the account with the code received by email' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }
  @Public()
  @Throttle(CODE_LIMIT)
  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new verification code' })
  resendCode(@Body() dto: EmailDto) {
    return this.authService.resendVerificationCode(dto.email);
  }
  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
  // Al doilea pas al autentificarii, doar pentru conturile cu PIN activ
  @Public()
  @Throttle(CODE_LIMIT)
  @Post('login/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Second login step: verify the security PIN' })
  loginPin(@Body() dto: LoginPinDto) {
    return this.authService.verifyLoginPin(dto.pinToken, dto.pin);
  }
  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiBearerAuth()
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: User) {
    return toSelfView(user);
  }
  // Resetarea parolei are un singur flux: POST /users/forgot-password si /users/reset-password
}
