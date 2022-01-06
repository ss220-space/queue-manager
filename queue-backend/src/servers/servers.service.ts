import { Injectable, Logger } from '@nestjs/common';
import IORedis from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { servers } from '@/queue.config.json';
import { PlayerListService } from '../playerList/playerList.service';
import { InternalEvent } from '../common/enums/internalEvent.enum';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { StatusEventsService } from '../status-events/status-events.service';
import { ServerStatus } from './dto/serverStatus.dto';
import { QueueService } from '../queue/queue.service';
import { Interval } from '@nestjs/schedule'
import { ByondService } from '../byond/byond.service';
import { ServersStatus } from './dto/serversStatus.dto'

@Injectable()
export class ServersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly playerListService: PlayerListService,
    private readonly statusEventsService: StatusEventsService,
    private readonly queueService: QueueService,
    private readonly byondService: ByondService,
    private eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(ServersService.name);
  private readonly redis: IORedis.Redis;
  
  async server(serverPort: string): Promise<ServerStatus> {
    const status = await this.status(serverPort)
    const { mode, respawn, enter, roundtime, listed, mapname, players, ticker_state, date } = status || {}
    const { name, port, queued, desc, connection_address, order } = servers[serverPort]

    const slots = queued ? await this.playerListService.getSlotStats(serverPort) : { max: 0, occupied: players}
    const queueSize = queued ? await this.queueService.queueSize(serverPort) : 0

    const stat = status ? {
      ticker_state,
      mode,
      roundtime,
      mapname,
      respawn: Boolean(respawn),
      enter: Boolean(enter),
      listed: Boolean(listed),
      slots,
      queueSize,
      date,
    } : null
    
    return {
      name,
      desc,
      connection_address,
      port,
      queued,
      order,
      status: stat,
    }
  }

  async servers(): Promise<ServersStatus> {
    const perServer = await Promise.all(Object.keys(servers).map(async serverPort => {
      return await this.server(serverPort)
    }))
    return {
      servers: perServer,
      now: Date.now(),
    }
  }

  async status(serverPort: string): Promise<any | null> {
    const statusString = await this.redis.get(`byond_${serverPort}_status`)
    const status = statusString ? JSON.parse(statusString) : null
    return status
  }

  @OnEvent(InternalEvent.ByondStatusUpdate, {promisify: true})
  async handleByondStatusUpdate(): Promise<void> {
    this.statusEventsService.onStatusUpdate(await this.servers());
  }

  @Interval(20000)
  async handleUpdateByondStatus(): Promise<void> {
    this.logger.debug('handleUpdateByondStatus Called (every 20 seconds)');
    await Promise.all(Object.keys(servers)
      ?.map(serverPort => {
        return [this.byondService.fetchStatus(serverPort), serverPort]
      })
      ?.map(async ([status, serverPort]) => {
        if (!status) 
          return
        const fetchedStatus = await status;
        if (!fetchedStatus)
          return
        fetchedStatus.date = new Date();
        await this.redis.set(`byond_${serverPort}_status`, JSON.stringify(fetchedStatus))
      }),
    )
    this.eventEmitter.emit(InternalEvent.ByondStatusUpdate)
  }
}
