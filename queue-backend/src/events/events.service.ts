import { Injectable } from '@nestjs/common';
import { Observable, Subscriber } from "rxjs";
import { IptablesEventMessageDto } from "./events.gateway";

@Injectable()
export class EventsService {
  constructor() {
    this.events = new Observable((subscriber) => {
      this.subscriber = subscriber
    })
  }

  events: Observable<IptablesEventMessageDto>

  private subscriber: Subscriber<IptablesEventMessageDto>

  onAddedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = "ALLOW"
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.subscriber.next(message)
  }

  onRemovedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = "REVOKE"
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.subscriber.next(message)
  }
}
