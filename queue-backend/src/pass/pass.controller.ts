import { Controller, Delete, Get, Param, Request, UseGuards } from '@nestjs/common';
import { RequestUserDto } from '../common/dto/requestUser.dto'
import { PassService } from './pass.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ServerPortDto } from '../common/dto/serverPort.dto'
import { RolesGuard } from '../roles/roles.guard'
import { Roles } from '../roles/roles.decorator'
import { AdminFlag } from '../roles/adminFlag.enum'

@Controller('pass')
export class PassController {
  constructor(private readonly passService: PassService) {}


  @UseGuards(JwtAuthGuard)
  @Get()
  async passes(@Request() { user: { ckey } }: RequestUserDto): Promise<string[]> {
    return await this.passService.getPassesByCkey(ckey)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminFlag.R_ADMIN, AdminFlag.R_SERVER)
  @Delete('/:ckey/:serverPort')
  async removePass(@Param() { ckey }, @Param() { serverPort }: ServerPortDto) {
    return await this.passService.removeCKeyPass(ckey, serverPort)
  }
}
