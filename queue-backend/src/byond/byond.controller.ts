import { Controller HttpStatus, HttpException, Get, Param } from '@nestjs/common';
import { ByondService } from './byond.service';
import { ServerPortDto } from '../common/dto/serverPort.dto';

@Controller('/api/byond')
export class ByondController {
  constructor(private readonly byondService: ByondService) {}

  @Get('playerlist_ext/:server_port')
  async getPlayerlistExt(@Param() { server_port }: ServerPortDto): Promise<string> {
    const result = await this.byondService.getPlayerlistExt(server_port)
    if(!result) {
      throw new HttpException(`Given ${server_port}`, HttpStatus.CONFLICT);
    }
    return result
  }
}

