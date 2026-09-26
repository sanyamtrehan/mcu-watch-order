import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './typings/payload.typing';
import { ENVIRONMENT } from 'src/helpers/configs/environment';
import { User } from './auth.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: ENVIRONMENT.SECRET_KEY,
      passReqToCallback: true,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.authService.findUser(payload.id);
  }
}
