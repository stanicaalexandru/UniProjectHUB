import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { appError } from '../common/errors';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  // Userul se citeste din baza de date la fiecare cerere: un cont sters, suspendat sau neaprobat
  // pierde accesul imediat, nu abia cand expira token-ul
  async validate(payload: { sub: string; email: string; role: string; purpose?: string }) {
    // Token-urile cu scop special (ex. biletul pentru pasul PIN) nu sunt token-uri de sesiune
    if (payload.purpose) throw new UnauthorizedException(appError('SESSION_EXPIRED'));
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException(appError('SESSION_EXPIRED'));
    return user;
  }
}
