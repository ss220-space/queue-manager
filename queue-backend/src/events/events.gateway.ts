import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import {Server} from 'ws';
import {forwardRef, Inject, Logger} from '@nestjs/common';
import {concat, filter, from, map, Observable} from 'rxjs';
import {EventsService} from "./events.service";
import {PassService} from "../pass/pass.service";


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

@WebSocketGateway(8080)
export class EventsGateway {
  constructor(
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventService: EventsService
  ) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger(EventsGateway.name);

  @SubscribeMessage('iptables')
  handleEvent(@MessageBody() data: IptablesInitRequestDto): Observable<WsResponse<any>> {
    this.logger.error(`iptables-control-daemon connected for ports: [${data.ports}]`);
    const initial = (async () => {
      const message = new IptablesInitialMessageDto()
      message.accepts = {}
      for (const port of data.ports) {
        message.accepts[port] = await this.passService.getPasses(port)
      }
      return message
    })()

    return concat(
      from(initial).pipe(map((data) => ({event: "Initial", data: <IptablesInitialMessageDto>data}))),
      this.eventService.events
        .pipe(
          filter((message) => message && data.ports.includes(message.target_port)),
          map((data) => ({event: "Event", data: <IptablesEventMessageDto>data}))
        )
    )
  }
}