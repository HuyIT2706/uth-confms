import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    const secret =
      config.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT access secret is not defined');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { 
      sub: payload.sub, 
      userId: payload.sub, 
      id: payload.sub,
      email: payload.email, 
      roles: payload.roles || [] 
    };
  }
}