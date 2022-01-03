import { Injectable, MessageEvent } from '@nestjs/common';
import {Subject} from 'rxjs';
import { ServerStatus } from '../servers/dto/serverStatus.dto';
import { ServerPassUpdate, ServerQueueStatus } from '../queue/dto/queueStatus.dto'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { QueuesState } from '../common/queues-state'
import { PassUpdateEvent } from '../common/events/pass-update.event'
import { AdminFlag } from '../roles/adminFlag.enum'
import { IpLinkService } from '../ipLink/ipLink.service'
import { PassService } from '../pass/pass.service'

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

class ClientConnectionCounter {

  constructor(private onTimeout: () => void) {
  }
  private count = 0
  private timeout?: NodeJS.Timeout

  incCount() {
    this.count += 1
    this.clearTimeout()
  }

  decCount() {
    if (this.count > 0) {
      this.count -= 1
    }
    if (!this.hasConnections()) {
      this.updateTimeout(
        setTimeout(() => {
          if (!this.hasConnections()) {
            this.onTimeout()
          }
        }, 5000),
      )
    }
  }

  hasConnections() {
    return this.count > 0
  }

  private updateTimeout(timeout: NodeJS.Timeout) {
    this.clearTimeout()
    this.timeout = timeout
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      delete this.timeout
    }
  }
}

@Injectable()
export class StatusEventsService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly ipLinkService: IpLinkService,
    private readonly passService: PassService,
  ) {
    this.statusEventSubject = new Subject<StatusEvent>()
    this.queuesEventSubject = new Subject<QueuesState>()
    this.passEventSubject = new Subject<PassUpdateEvent>()
  }

  statusEventSubject: Subject<StatusEvent>
  queuesEventSubject: Subject<QueuesState>
  passEventSubject: Subject<PassUpdateEvent>

  private clientConnections: {
    [ckey: string]: ClientConnectionCounter
  } = {}

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

  async onClientConnect(ckey: string, adminFlags: number, ip: string) {
    await this.ipLinkService.linkIp(ckey, ip)
    if ((adminFlags & (AdminFlag.R_MENTOR | AdminFlag.R_MOD | AdminFlag.R_ADMIN)) !== 0) {
      this.passService.addPassesForCkey(ckey)
    }

    if (!this.clientConnections[ckey]) {
      this.clientConnections[ckey] = new ClientConnectionCounter(
        () => {
          console.log(`Client disconnect sent ${ckey}`)
          this.eventEmitter.emit(InternalEvent.StatusEventsDisconnect, ckey)
          delete this.clientConnections[ckey]
        },
      )
    }
    this.clientConnections[ckey].incCount()
  }

  onClientDisconnect(ckey: string) {
    const connectionCounter = this.clientConnections[ckey]
    connectionCounter.decCount()
  }
}
