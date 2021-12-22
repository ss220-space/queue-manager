import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

export class JwtPayloadDto {
  sub: string
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {
  }

  generateUserToken(key: string, signOptions: JwtSignOptions = {},): string {
    return this.jwtService.sign({ sub: key }, signOptions)
  }

  verifyUserToken(token: string, verifyOptions: JwtVerifyOptions = {}): JwtPayloadDto {
    return this.jwtService.verify(token, verifyOptions)
  }
}