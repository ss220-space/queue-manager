import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import { ServerStatus } from '../servers/dto/serverStatus.dto';

export class StatusEvent implements MessageEvent {
  data: ServerStatus[];
  type = StatusEvent.name;
}

@Injectable()
export class StatusEventsService {
  constructor() {
    this.statusEvents = new Observable((subscriber) => {
      this.statusSubscriber = subscriber
    })
  }

  statusEvents: Observable<StatusEvent>
  private statusSubscriber: Subscriber<StatusEvent>

  onStatusUpdate(data: ServerStatus[]): void {
    const allStatus = new StatusEvent ()
    allStatus.data = data
    this.statusSubscriber.next(allStatus)
  }
}
