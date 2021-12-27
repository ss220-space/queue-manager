import { Controller, Get, Param, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUserDto } from '../common/dto/requestUser.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }
  
  @Get(':ckey')
  @UseGuards(JwtAuthGuard)
  async getUserPrivilegesByCkey(@Request() { user: { ckey } }: RequestUserDto) {
    const user = await this.usersService.getUserPrivilegesByCkey(ckey)
    if (!user) {
      throw new NotFoundException(`User with ckey "${ckey}" is not found`)
    }
    return user
  }

  @Get('ban')
  @UseGuards(JwtAuthGuard)
  async getActiveBanByCkey(@Request() { user: { ckey } }: RequestUserDto) {
    const ban = await this.usersService.getActiveBanByCkey(ckey)
    if (!ban) {
      throw new NotFoundException(`Active bans of user with ckey "${ckey}" are not found`)
    }
    return ban
  }
}
