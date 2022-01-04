import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { concat, filter, from, map, Observable } from 'rxjs';
import { IptablesEventsService } from './iptablesEvents.service';

export class IptablesInitRequestDto {
  ports: number[]
}

export class IptablesInitialMessageDto {
  accepts: {
    [index: number]: string[]
  }
}

export class IptablesEventMessageDto {
  action: string
  inbound_address: string
  target_port: number
}

@WebSocketGateway()
export class IptablesEventsGateway {
  constructor(
    private readonly eventService: IptablesEventsService,
  ) { }

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger(IptablesEventsGateway.name);

  @SubscribeMessage('iptables')
  handleEvent(@MessageBody() data: IptablesInitRequestDto): Observable<WsResponse<any>> {
    this.logger.log(`iptables-control-daemon connected for ports: [${data.ports}]`);
    const initial = (async () => {
      const message = new IptablesInitialMessageDto()
      message.accepts = {}
      for (const port of data.ports) {
        message.accepts[port] = await this.eventService.getIpPasses(`${port}`)
      }
      return message
    })()

    return concat(
      from(initial).pipe(map((data) => ({ event: 'Initial', data: <IptablesInitialMessageDto>data }))),
      this.eventService.eventsSubject.asObservable()
        .pipe(
          filter((message) => message && data.ports.includes(message.target_port)),
          map((data) => ({ event: 'Event', data: <IptablesEventMessageDto>data })),
        ),
    )
  }
}