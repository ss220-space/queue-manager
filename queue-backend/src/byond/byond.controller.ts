import { Controller, HttpStatus, HttpException, Get, Param, UseGuards } from '@nestjs/common'
import { ByondService } from './byond.service'
import { ServerPortDto } from '../common/dto/serverPort.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../roles/roles.decorator'
import { AdminFlag } from '../roles/adminFlag.enum'
import { RolesGuard } from '../roles/roles.guard'

@Controller('byond')
export class ByondController {
  constructor(private readonly byondService: ByondService) { }

  @Get('playerlist_ext/:serverPort')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminFlag.R_ADMIN, AdminFlag.R_BAN)
  async getPlayerlistExt(@Param() { serverPort }: ServerPortDto): Promise<string> {
    const result = await this.byondService.getPlayerlistExt(serverPort)
    if (!result) {
      throw new HttpException(`Something bad happend when fetching server_port (${serverPort})`, HttpStatus.CONFLICT)
    }
    return result
  }
}

