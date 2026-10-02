import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ERROR_MESSAGES, ErrorCode, appError } from '../errors';

// Cod generic pentru erorile care nu au un cod propriu din catalog
const STATUS_CODE: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST', 401: 'SESSION_EXPIRED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
  409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 429: 'TOO_MANY_REQUESTS',
};

// Mesajele implicite din class-validator sunt in engleza ("email must be an email"); cele scrise de noi sunt in romana
const isDefaultValidatorMessage = (m: string) => /\b(must|should|is not|are not|has failed|property)\b/i.test(m);

// Toate erorile ajung la client in acelasi format: { success: false, statusCode, code, message, details? }.
// Erorile neprevazute se logheaza complet pe server, dar clientul primeste doar un mesaj generic (fara detalii interne).
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') throw exception; // WebSocket-ul isi trateaza singur erorile
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, body } = this.normalize(exception);

    if (status >= 500) this.logger.error(`${request.method} ${request.url} - ${status}`, (exception as Error)?.stack);
    else this.logger.warn(`${request.method} ${request.url} - ${status} ${body.code}`);

    response.status(status).json({ success: false, statusCode: status, timestamp: new Date().toISOString(), path: request.url, ...body });
  }

  private normalize(exception: unknown): { status: number; body: { code: string; message: string; details?: string[]; params?: unknown } } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as { code?: string; message?: unknown; params?: unknown } | string;
      // Eroare din catalog: appError('COD')
      if (res && typeof res === 'object' && res.code && ERROR_MESSAGES[res.code as ErrorCode]) {
        return { status, body: { code: res.code, message: String(res.message), ...(res.params ? { params: res.params } : {}) } };
      }
      // Erori de validare (ValidationPipe): lista de mesaje pe campuri
      if (res && typeof res === 'object' && Array.isArray(res.message)) {
        const details: string[] = res.message;
        const own = details.find((m) => !isDefaultValidatorMessage(m));
        return { status, body: { code: 'VALIDATION_FAILED', message: own || ERROR_MESSAGES.VALIDATION_FAILED, details } };
      }
      // Orice alta eroare HTTP (ex. limita de cereri, fisier prea mare): mesaj prietenos dupa status
      const code = STATUS_CODE[status] || (status >= 500 ? 'INTERNAL' : 'BAD_REQUEST');
      return { status, body: appError(code) };
    }
    // Id invalid in URL (ex. /projects/abc): PostgreSQL refuza conversia la uuid -> resursa nu exista
    if (exception instanceof QueryFailedError) {
      const pg = (exception as QueryFailedError & { driverError?: { code?: string } }).driverError?.code;
      if (pg === '22P02') return { status: HttpStatus.NOT_FOUND, body: appError('NOT_FOUND') };
      if (pg === '23505') return { status: HttpStatus.CONFLICT, body: appError('CONFLICT') };
    }
    if (exception instanceof EntityNotFoundError) return { status: HttpStatus.NOT_FOUND, body: appError('NOT_FOUND') };
    // Erori ridicate de Express/body-parser inainte de Nest (ex. corp JSON prea mare sau invalid)
    const raw = exception as { status?: number; statusCode?: number } | null;
    const status = Number(raw?.status || raw?.statusCode);
    if (status === 413) return { status, body: appError('PAYLOAD_TOO_LARGE') };
    if (status === 400) return { status, body: appError('BAD_REQUEST') };
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: appError('INTERNAL') };
  }
}
