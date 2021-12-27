import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayloadDto } from './dto/jwtPayload.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    ) {
  }

  async generateUserToken(ckey: string, signOptions: JwtSignOptions = {}): Promise<string> {
    const user = await this.getProfile(ckey);
    return this.jwtService.sign({ 
      sub: ckey,  
      roles: user.adminFlags, 
      ban: user.hasActiveBan,
    }, signOptions)
  }

  verifyUserToken(token: string, verifyOptions: JwtVerifyOptions = {}): JwtPayloadDto {
    return this.jwtService.verify(token, verifyOptions)
  }

  async getProfile(ckey: string) {
    const user = await this.usersService.getUserPrivilegesByCkey(ckey)
    const ban = await this.usersService.getActiveBanByCkey(ckey)
    return {
      ckey,
      adminFlags: user.adminFlags,
      hasActiveBan: ban ? true : false,
    }
  }
}
