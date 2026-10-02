import { Module } from '@nestjs/common';
import { ShowcaseService } from './showcase.service';
import { HealthController } from '../health/health.controller';

// Functii de exploatare: verificarea de functionare si reincarcarea datelor in demo-ul public
@Module({ controllers: [HealthController], providers: [ShowcaseService] })
export class ShowcaseModule {}
