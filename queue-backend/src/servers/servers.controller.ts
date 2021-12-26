import { Controller, Get, InternalServerErrorException, Param, Query } from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) { }

  @Get('status/:serverPort')
  async server(@Param() { serverPort }: ServerPortDto) {
    const server = await this.serversService.server(serverPort)
    if (!server) {
      throw new InternalServerErrorException()
    }
    return server
  }

  @Get('status')
  async servers() {
    return this.serversService.servers()
  }
}
