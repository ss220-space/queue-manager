import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class UserTokenDto {
  sub: string
  scope: 'user-auth'
}

@Injectable()
export class UserAuthService {
  constructor(private readonly jwtService: JwtService) {
  }

  generateUserToken(key: string): string {
    return this.jwtService.sign({ sub: key, scope: 'user-auth' }, { expiresIn: '12h' })
  }

  verifyUserToken(token: string): UserTokenDto {
    return this.jwtService.verify(token, { ignoreExpiration: false })
  }
}