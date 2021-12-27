import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Sse,
  MessageEvent,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { ServersService } from './servers.service';
import { filter, map, merge, Observable, pairwise, startWith } from 'rxjs';
import { PassEvent, QueueEvent, StatusEventsService } from '../status-events/status-events.service';
import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import { RequestUserDto } from '@/src/common/dto/requestUser.dto';
import { AdminFlag } from '../roles/adminFlag.enum';
import { IpLinkService } from '../ipLink/ipLink.service';
import { PassService } from '../pass/pass.service';

@Controller('servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly statusEventsService: StatusEventsService,
    private readonly ipLinkService: IpLinkService,
    private readonly passService: PassService,
  ) {
  }

  @Get('status/:serverPort')
  async server(@Param() {serverPort}: ServerPortDto) {
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

  @UseGuards(JwtAuthGuard)
  @Sse('status-events')
  async statusEvents(@Request() {user: {ckey, adminFlags}}: RequestUserDto, @Ip() ip: string): Promise<Observable<MessageEvent>> {
    await this.ipLinkService.linkIp(ckey, ip)
    if ((adminFlags & (AdminFlag.R_MENTOR | AdminFlag.R_MOD | AdminFlag.R_ADMIN)) !== 0) {
      this.passService.addPassesForCkey(ckey)
    }

    const queueUpdates = this.statusEventsService.queuesEventSubject.asObservable().pipe(
      map((queuesUpdate) => {
        return queuesUpdate
          .map((serverQueue) => {
            return {
              serverPort: serverQueue.serverPort,
              position: serverQueue.players.indexOf(ckey),
              total: serverQueue.players.length,
            }
          })
          .filter((serverQueue) => serverQueue.position !== -1)
      }),
      startWith(null),
      pairwise(),
      filter(([prev, serverQueues]) => serverQueues.length > 0 || prev.length > 0),
      map(([, serverQueues]) => {
        const event = new QueueEvent()
        event.data = serverQueues
        return event
      }),
    )

    const passUpdates = this.statusEventsService.passEventSubject.asObservable()
      .pipe(
        filter(({ckey: eventCkey}) => eventCkey === ckey),
        map(({passes}) => {
          const event = new PassEvent()
          event.data = passes
          return event
        }),
      )

    return merge(
      queueUpdates,
      passUpdates,
      this.statusEventsService.statusEventSubject.asObservable(),
    )
  }
}
