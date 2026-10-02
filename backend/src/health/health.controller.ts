import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { isMailConfigured } from '../common/showcase';

// Verificarea de functionare folosita de gazduire (si de CI): raspunde fara autentificare
@Controller('health')
export class HealthController {
  @Public()
  @SkipThrottle()
  @Get()
  check() {
    // emailEnabled: interfata stie daca poate cere coduri pe email (inregistrare, resetarea parolei)
    return { status: 'ok', emailEnabled: isMailConfigured() };
  }
}
