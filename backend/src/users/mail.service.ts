import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Orice text dinamic (nume, titluri, mesaje scrise de utilizatori) se escapeaza inainte sa ajunga in HTML:
// altfel un comentariu sau un mesaj de chat ar putea injecta linkuri sau formulare in emailuri "oficiale"
const esc = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const COLORS = { primary: '#1d4ed8', text: '#0f172a', muted: '#475569', soft: '#64748b', border: '#e2e8f0', bg: '#f8fafc' };

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private consoleOnly = false;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const user = this.configService.get('MAIL_USER');
    const host = this.configService.get('MAIL_HOST');
    if (!user) {
      // Fara cont de email configurat (ex. cineva care cloneaza proiectul): in dezvoltare emailurile se afiseaza
      // in consola, ca aplicatia sa poata fi testata; in productie e o eroare de configurare
      if (this.configService.get('NODE_ENV') === 'production') this.logger.error('MAIL_USER lipseste: emailurile nu pot fi trimise');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.consoleOnly = true;
      return;
    }
    // Orice server SMTP (MAIL_HOST/MAIL_PORT/MAIL_SECURE); implicit Gmail
    this.transporter = nodemailer.createTransport(host ? {
      host,
      port: Number(this.configService.get('MAIL_PORT')) || 587,
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: { user, pass: this.configService.get('MAIL_PASS') },
    } : {
      service: 'gmail',
      auth: { user, pass: this.configService.get('MAIL_PASS') },
    });
  }

  private get appUrl() {
    return this.configService.get('FRONTEND_URL', 'http://localhost:3000');
  }

  // Structura comuna a tuturor emailurilor: antet, continut, subsol cu identitatea aplicatiei
  private layout(bodyHtml: string, footerNote?: string) {
    return `
<div style="background:${COLORS.bg};padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);padding:24px;text-align:center;">
      <div style="display:inline-block;background:#ffffff;width:44px;height:44px;border-radius:10px;line-height:44px;color:#1e40af;font-weight:bold;font-size:20px;">U</div>
      <div style="color:#ffffff;font-size:19px;font-weight:bold;margin-top:10px;">UniProject Hub</div>
      <div style="color:#dbeafe;font-size:13px;margin-top:2px;">Platformă pentru managementul proiectelor studențești</div>
    </div>
    <div style="padding:28px 28px 8px 28px;color:${COLORS.text};font-size:15px;line-height:1.6;">${bodyHtml}</div>
    <div style="padding:16px 28px 24px 28px;border-top:1px solid ${COLORS.border};margin-top:16px;color:${COLORS.soft};font-size:12px;line-height:1.5;text-align:center;">
      ${footerNote ? `<div style="margin-bottom:6px;">${footerNote}</div>` : ''}
      <div>UniProject Hub · <a href="${esc(this.appUrl)}" style="color:${COLORS.primary};">${esc(this.appUrl.replace(/^https?:\/\//, ''))}</a></div>
      <div>Acest email a fost trimis automat. Te rugăm să nu răspunzi la el.</div>
    </div>
  </div>
</div>`;
  }

  private code(value: string) {
    return `<div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;padding:18px;text-align:center;margin:18px 0;">
      <span style="font-size:34px;font-weight:bold;color:#1e40af;letter-spacing:8px;">${esc(value)}</span></div>`;
  }

  private button(label: string, href: string) {
    return `<div style="text-align:center;margin:22px 0;"><a href="${esc(href)}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:9px;">${esc(label)}</a></div>`;
  }

  private async send(to: string, subject: string, html: string, kind: string) {
    try {
      await this.transporter.sendMail({ from: `"UniProject Hub" <${this.configService.get('MAIL_FROM') || this.configService.get('MAIL_USER') || 'no-reply@localhost'}>`, to, subject, html });
      if (this.consoleOnly) {
        // Versiunea text a emailului, ca un cod de confirmare sa poata fi citit direct din consola
        const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
        this.logger.log(`[email netrimis - MAIL_USER lipseste] Catre: ${to} | ${subject}\n${text}`);
      } else {
        this.logger.log(`Email "${kind}" trimis`);
      }
    } catch (error) {
      this.logger.error(`Email "${kind}" netrimis: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendVerificationCode(to: string, verificationCode: string, firstName: string) {
    await this.send(to, 'Confirmă-ți adresa de email — UniProject Hub', this.layout(`
      <h2 style="margin:0 0 8px 0;font-size:20px;">Salut, ${esc(firstName)}!</h2>
      <p style="margin:0;color:${COLORS.muted};">Mai ai un singur pas până la contul tău. Introdu codul de mai jos în aplicație:</p>
      ${this.code(verificationCode)}
      <p style="margin:0 0 6px 0;color:${COLORS.muted};font-size:13px;">Codul expiră în <strong>15 minute</strong>.</p>
    `, 'Dacă nu tu ai creat acest cont, poți ignora emailul; contul nu va fi activat.'), 'confirmare cont');
  }

  async sendPasswordResetEmail(to: string, resetCode: string, firstName: string) {
    await this.send(to, 'Resetarea parolei — UniProject Hub', this.layout(`
      <h2 style="margin:0 0 8px 0;font-size:20px;">Salut, ${esc(firstName)}!</h2>
      <p style="margin:0;color:${COLORS.muted};">Am primit o cerere de resetare a parolei pentru contul tău. Codul de resetare este:</p>
      ${this.code(resetCode)}
      <p style="margin:0 0 6px 0;color:${COLORS.muted};font-size:13px;">Codul expiră în <strong>15 minute</strong>. După resetare, vei fi deconectat de pe toate dispozitivele.</p>
    `, 'Dacă nu tu ai cerut resetarea, ignoră acest email: parola ta rămâne neschimbată.'), 'resetare parola');
  }

  // Trimis cand contul devine activ: studentii dupa confirmarea emailului, profesorii dupa aprobare
  async sendWelcomeEmail(to: string, firstName: string, role: string) {
    const steps = role === 'professor'
      ? ['Creează un proiect sau acceptă coordonarea proiectelor propuse de studenți', 'Urmărește progresul echipelor în Dashboard și Gantt', 'Evaluează proiectele pe criterii, cu istoric al corecturilor']
      : ['Creează o echipă sau cere să intri într-una existentă', 'Pornește un proiect și alege un profesor coordonator', 'Împarte munca în milestone-uri și task-uri și discută în chat'];
    await this.send(to, 'Bine ai venit în UniProject Hub!', this.layout(`
      <h2 style="margin:0 0 8px 0;font-size:20px;">Bine ai venit, ${esc(firstName)}! 🎉</h2>
      <p style="margin:0 0 14px 0;color:${COLORS.muted};">${role === 'professor' ? 'Un administrator ți-a aprobat contul de profesor, care este acum activ.' : 'Contul tău este activ.'} Câteva idei pentru început:</p>
      <ul style="margin:0 0 6px 18px;padding:0;color:${COLORS.muted};">${steps.map((s) => `<li style="margin-bottom:6px;">${esc(s)}</li>`).join('')}</ul>
      ${this.button('Intră în aplicație', `${this.appUrl}/login`)}
      <p style="margin:0;color:${COLORS.soft};font-size:13px;">Pentru un plus de siguranță, poți activa PIN-ul de securitate din pagina Setări.</p>
    `), 'bun venit');
  }

  async sendNotificationEmail(to: string, firstName: string, title: string, message: string) {
    const when = new Date().toLocaleString('ro', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    await this.send(to, `${title} · ${when}`, this.layout(`
      <h2 style="margin:0 0 8px 0;font-size:20px;">Salut, ${esc(firstName)}!</h2>
      <div style="background:#eff6ff;border-left:4px solid ${COLORS.primary};border-radius:8px;padding:16px;margin:16px 0;">
        <div style="color:#1e40af;font-weight:bold;margin-bottom:6px;">${esc(title)}</div>
        <div style="color:${COLORS.muted};font-size:14px;">${esc(message)}</div>
      </div>
      ${this.button('Deschide aplicația', this.appUrl)}
    `, 'Primești acest email pentru că ai activat notificările pe email. Le poți opri oricând din Setări.'), 'notificare');
  }
}
