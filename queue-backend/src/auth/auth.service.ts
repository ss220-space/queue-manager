import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayloadDto } from './dto/jwtPayload.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    ) {
  }

  async generateUserToken(ckey: string, signOptions: JwtSignOptions = {}): Promise<string> {
    const user = await this.getProfile(ckey);
    const jwtPayload: JwtPayloadDto = { 
      sub: ckey,  
      roles: user.adminFlags,
      donor: user.donatorTier,
      ban: user.hasActiveBan,
    }
    return this.jwtService.sign(jwtPayload, signOptions)
  }

  verifyUserToken(token: string, verifyOptions: JwtVerifyOptions = {}): JwtPayloadDto {
    return this.jwtService.verify(token, verifyOptions)
  }

  async getProfile(ckey: string): Promise<UserDto> {
    const user = await this.usersService.getUserPrivilegesByCkey(ckey)
    const ban = await this.usersService.getActiveBanByCkey(ckey)
    return {
      ckey,
      adminFlags: user.adminFlags,
      donatorTier: user.donatorTier,
      hasActiveBan: ban ? true : false,
    }
  }
}
