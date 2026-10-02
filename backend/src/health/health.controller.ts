import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';

// Verificarea de functionare folosita de gazduire (si de CI): raspunde fara autentificare
@Controller('health')
export class HealthController {
  @Public()
  @SkipThrottle()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
