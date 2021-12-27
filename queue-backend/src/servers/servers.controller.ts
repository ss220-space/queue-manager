import { Controller, Get, InternalServerErrorException, Param, Sse, MessageEvent } from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { ServersService } from './servers.service';
import { concat, interval, map, Observable } from 'rxjs';
import { StatusEventsService } from '../status-events/status-events.service';

@Controller('servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly statusEventsService: StatusEventsService,
  ) { }

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

  @Sse('status-events')
  statusEvents(): Observable<MessageEvent> {
    return this.statusEventsService.statusEvents;
  }
}
