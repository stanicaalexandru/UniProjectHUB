import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execFile } from 'child_process';
import { join } from 'path';
import { isShowcase } from '../common/showcase';

// In demo-ul public datele (inclusiv conturile create de vizitatori) se refac din seed in fiecare noapte.
// Pe gazduirea gratuita se refac si la fiecare pornire a serverului (comanda start:showcase).
@Injectable()
export class ShowcaseService {
  private readonly logger = new Logger(ShowcaseService.name);

  @Cron('0 3 * * *', { timeZone: 'Europe/Bucharest' })
  resetDemoData() {
    if (!isShowcase()) return;
    const script = join(__dirname, '..', 'database', 'seed.js');
    execFile(process.execPath, [script], { timeout: 120_000 }, (err) => {
      if (err) this.logger.error(`Reincarcarea datelor demo a esuat: ${err.message}`);
      else this.logger.log('Datele demo au fost reincarcate');
    });
  }
}
