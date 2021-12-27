import { Injectable, Logger } from '@nestjs/common';
import IORedis from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { servers } from '@/queue.config.json';
import { PlayerListService } from '../playerList/playerList.service';
import { InternalEvent } from '../common/enums/internalEvent.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { StatusEventsService } from '../status-events/status-events.service';
import { ServerStatus } from './dto/serverStatus.dto';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ServersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly playerListService: PlayerListService,
    private readonly statusEventsService: StatusEventsService,
    private readonly queueService: QueueService,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(ServersService.name);
  private readonly redis: IORedis.Redis;
  
  async server(serverPort: string): Promise<ServerStatus> {
    const status = await this.redis.get(`byond_${serverPort}_status`)

    const { mode, respawn, enter, roundtime, listed, mapname, players } = JSON.parse(status) || {}
    const { name, port, queued, desc, connection_address } = servers[serverPort]

    const slots = queued ? await this.playerListService.getSlotStats(serverPort) : { max: 0, occupied: players}
    const queueSize = queued ? await this.queueService.queueSize(serverPort) : 0

    const stat = status ? {
      mode,
      roundtime,
      mapname,
      respawn: Boolean(respawn),
      enter: Boolean(enter),
      listed: Boolean(listed),
      slots,
      queueSize,
    } : null
    
    return {
      name,
      desc,
      connection_address,
      port,
      queued,
      status: stat,
    }
  }

  async servers(): Promise<ServerStatus[]> {
    return await Promise.all(Object.keys(servers).map(async serverPort => {
      return await this.server(serverPort)
    }))
  }

  @OnEvent(InternalEvent.ByondStatusUpdate, {promisify: true})
  async handleByondStatusUpdate(): Promise<void> {
    this.statusEventsService.onStatusUpdate(await this.servers());
  }
}
