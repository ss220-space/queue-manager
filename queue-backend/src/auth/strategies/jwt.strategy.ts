import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadDto } from '../dto/jwtPayload.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      algorithms: 'HS512',
    });
  }

  async validate(payload: JwtPayloadDto): Promise<UserDto> {
    return { 
      ckey: payload.sub,
      adminFlags: payload.roles,
      donatorTier: payload.donor,
      hasActiveBan: payload.ban,
    };
  }
}