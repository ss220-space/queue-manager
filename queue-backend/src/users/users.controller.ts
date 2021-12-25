import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }
  
  @Get(':ckey')
  async getUserPrivilegesByCkey(@Param('ckey') ckey: string) {
    const user = await this.usersService.getUserPrivilegesByCkey(ckey)
    if (!user) {
      throw new NotFoundException(`User with ckey "${ckey}" is not found`)
    }
    return user
  }
}
