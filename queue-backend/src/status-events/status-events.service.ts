import { Injectable, MessageEvent } from '@nestjs/common';
import {Subject} from 'rxjs';
import { ServerStatus } from '../servers/dto/serverStatus.dto';
import { ServerPassUpdate, ServerQueueStatus } from '../queue/dto/queueStatus.dto'
import { OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { QueuesState } from '../common/queues-state'
import { PassUpdateEvent } from '../common/events/pass-update.event'

export class StatusEvent implements MessageEvent {
  data: ServerStatus[];
  type = StatusEvent.name;
}

export class QueueEvent implements MessageEvent {
  data: ServerQueueStatus
  type = QueueEvent.name
}

export class PassEvent implements MessageEvent {
  data: ServerPassUpdate
  type = PassEvent.name
}

@Injectable()
export class StatusEventsService {
  constructor() {
    this.statusEventSubject = new Subject<StatusEvent>()
    this.queuesEventSubject = new Subject<QueuesState>()
    this.passEventSubject = new Subject<PassUpdateEvent>()
  }

  statusEventSubject: Subject<StatusEvent>
  queuesEventSubject: Subject<QueuesState>
  passEventSubject: Subject<PassUpdateEvent>

  onStatusUpdate(data: ServerStatus[]): void {
    const allStatus = new StatusEvent()
    allStatus.data = data
    this.statusEventSubject.next(allStatus)
  }

  @OnEvent(InternalEvent.QueuesUpdate)
  handleQueueUpdate(event: QueuesState): void {
    this.queuesEventSubject.next(event)
  }

  @OnEvent(InternalEvent.PassUpdate)
  handlePassUpdate(event: PassUpdateEvent): void {
    this.passEventSubject.next(event)
  }
}
