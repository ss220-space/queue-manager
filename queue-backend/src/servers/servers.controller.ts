import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Sse,
  MessageEvent,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { ServersService } from './servers.service';
import { filter, finalize, map, merge, Observable, pairwise, startWith } from 'rxjs';
import { PassEvent, QueueEvent, StatusEventsService } from '../status-events/status-events.service';
import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import { RequestUserDto } from '@/src/common/dto/requestUser.dto';
import { RealIp } from '../common/decorators/real-ip.decorator';

@Controller('servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly statusEventsService: StatusEventsService,
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
  async statusEvents(@Request() { user }: RequestUserDto, @RealIp() ip: string): Promise<Observable<MessageEvent>> {
    const { ckey } = user
    await this.statusEventsService.onClientConnect(user, ip)

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
      filter(([prev, serverQueues]) => serverQueues.length > 0 || (prev !== null && prev.length > 0)),
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
    ).pipe(
      finalize(() => {
        this.statusEventsService.onClientDisconnect(ckey)
        return
      }),
    )
  }
}
