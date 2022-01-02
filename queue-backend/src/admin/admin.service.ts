import { Injectable } from '@nestjs/common'
import { MessageEvent } from '@nestjs/common'
import { QueuesState } from '../common/queues-state'
import { PassService } from '../pass/pass.service'
import { PlayerListService } from '../playerList/playerList.service'
import { bufferTime, concat, from, map, mergeMap, Observable, Subject, switchMap } from 'rxjs'
import { queuedServerList } from '../config/server-config'
import { OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { QueueService } from '../queue/queue.service'

type QueuesData = {
  [serverPort: string]: {
    players: string[]
  }
}

type PlayersData = {
  players: {
    ckey: string,
    pass: boolean
    new: boolean
    playing: boolean
  }[],
  serverPort: string
}


export class AdminQueuesUpdateEvent implements MessageEvent {
  type = AdminQueuesUpdateEvent.name
  data: QueuesData
  constructor(queues: QueuesState) {
    this.data = {}
    for (const queue of queues) {
      this.data[queue.serverPort] = { players: queue.players }
    }
  }
}

export class AdminPlayersUpdateEvent {
  type = AdminPlayersUpdateEvent.name
  data: PlayersData
  constructor(data: PlayersData) {
    this.data = data
  }
}


@Injectable()
export class AdminService {


  constructor(private readonly passService: PassService,
              private readonly playerListService: PlayerListService,
              private readonly queueService: QueueService) {
    this.passUpdatesSubject = new Subject<string>()
    this.queuesUpdatesSubject = new Subject<QueuesState>()
  }

  private passUpdatesSubject: Subject<string>
  private queuesUpdatesSubject: Subject<QueuesState>

  async playerUpdateEvents(): Promise<Observable<AdminPlayersUpdateEvent>> {
    const initial = await Promise.all(queuedServerList.map((server) => this.createPlayerUpdateEvent(`${server.port}`)))
    const updates = this.passUpdatesSubject.asObservable().pipe(
      bufferTime(1000),
      mergeMap((ports) => {
        const uniquePorts = new Set(ports)
        return [...uniquePorts]
      }),
      switchMap(async (serverPort) => await this.createPlayerUpdateEvent(serverPort)),
    )
    return concat(
      from(initial),
      updates,
    )
  }

  async queueUpdateEvents(): Promise<Observable<AdminQueuesUpdateEvent>> {
    const initial = new AdminQueuesUpdateEvent(await this.queueService.getQueues())

    return concat(
      from([initial]),
      this.queuesUpdatesSubject.asObservable().pipe(
        map((queuesState) => new AdminQueuesUpdateEvent(queuesState)),
      ),
    )
  }

  private async createPlayerUpdateEvent(serverPort: string): Promise<AdminPlayersUpdateEvent> {
    const players = {}
    for (const [ckey, data] of Object.entries(await this.playerListService.getPlayerList(serverPort))) {
      players[ckey] = {
        ckey,
        pass: false,
        new: data.new,
        playing: !data.new,
      }
    }


    for (const ckey of await this.passService.getServerPasses(serverPort)) {
      if (players[ckey]) {
        players[ckey] = {
          ...players[ckey],
          pass: true,
        }
      } else {
        players[ckey] = {
          ckey,
          pass: true,
          new: false,
          playing: false,
        }
      }
    }

    return new AdminPlayersUpdateEvent(
      {
        players: Object.values(players),
        serverPort: serverPort,
      },
    )
  }

  @OnEvent(InternalEvent.PassAdded)
  private onPassAdded({serverPort}) {
    this.passUpdatesSubject.next(serverPort)
  }

  @OnEvent(InternalEvent.PassRemoved)
  private onPassRemoved({serverPort}) {
    this.passUpdatesSubject.next(serverPort)
  }

  @OnEvent(InternalEvent.QueuesUpdate, {promisify:true})
  private async onQueuesUpdate(state: QueuesState): Promise<void> {
    this.queuesUpdatesSubject.next(state)
  }

}