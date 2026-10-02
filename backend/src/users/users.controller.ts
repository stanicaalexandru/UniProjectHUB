import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { toSelfView } from './user-view';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { appError } from '../common/errors';
import { AvatarDto, ChangePasswordDto, DeleteAccountDto, ForgotPasswordDto, ResetPasswordDto, SetPinDto, UpdateUserDto } from './dto';
import { assertNotSharedDemoAccount } from '../common/showcase';

// Fiecare isi poate modifica doar propriul cont; adminul poate modifica orice cont
function assertSelfOrAdmin(actor: User, id: string) {
  if (actor.id !== id && actor.role !== UserRole.ADMIN) throw new ForbiddenException(appError('OWN_ACCOUNT_ONLY'));
}
// Pentru date strict personale (parola, PIN) nici adminul nu actioneaza in locul userului
function assertSelf(actor: User, id: string) {
  if (actor.id !== id) throw new ForbiddenException(appError('OWN_ACCOUNT_ONLY'));
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get() findAll(@Query() q: Record<string, string>) { return this.usersService.findAll(q); }
  @Get('students') getStudents() { return this.usersService.getStudents(); }
  @Get('professors') getProfessors() { return this.usersService.getProfessors(); }
  @Get('me') getMe(@CurrentUser() user: User) { return toSelfView(user); }
  // ID-ul vine din token, nu din URL: nimeni nu poate sterge contul altcuiva
  @Delete('me') deleteMe(@CurrentUser() user: User, @Body() dto: DeleteAccountDto) {
    assertNotSharedDemoAccount(user);
    return this.usersService.deleteAccount(user.id, dto.password);
  }
  // PIN de securitate: activare/schimbare si dezactivare, ambele confirmate cu parola curenta
  @Put('me/pin') setPin(@CurrentUser() user: User, @Body() dto: SetPinDto) {
    assertNotSharedDemoAccount(user);
    return this.usersService.setPin(user.id, dto.currentPassword, dto.pin);
  }
  @Delete('me/pin') removePin(@CurrentUser() user: User, @Body() dto: DeleteAccountDto) {
    assertNotSharedDemoAccount(user);
    return this.usersService.removePin(user.id, dto.password);
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.usersService.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: User) {
    assertSelfOrAdmin(user, id);
    return this.usersService.updateProfile(id, dto, user.role === UserRole.ADMIN && user.id !== id);
  }

  @Post(':id/avatar') async uploadAvatar(@Param('id') id: string, @Body() dto: AvatarDto, @CurrentUser() user: User) {
    assertSelf(user, id);
    return this.usersService.setAvatar(id, dto.avatar);
  }

  @Patch(':id/change-password') async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto, @CurrentUser() user: User) {
    assertSelf(user, id);
    assertNotSharedDemoAccount(user);
    return this.usersService.changePassword(id, dto.currentPassword, dto.newPassword);
  }

  // Limita stricta pe IP: rutele cu coduri de 6 cifre nu trebuie sa permita incercari in masa
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password') async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password') async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPasswordWithCode(dto.email, dto.code, dto.newPassword);
  }

}
