import { Injectable, Logger } from '@nestjs/common'
import { servers } from '@/queue.config.json'
import fetchByond from './http2byond'
import { RedisService } from 'nestjs-redis'
import IORedis from 'ioredis';
import { Interval } from '@nestjs/schedule'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum';

@Injectable()
export class ByondService {
  constructor(
    private readonly redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(ByondService.name);
  private readonly redis: IORedis.Redis;

  async fetchStatus(serverPort: string): Promise<any> {
    const server = servers[serverPort];

    try {
      const queryByond = await fetchByond(server)

      switch (server.format) {
        case 'json':
          return await JSON.parse(queryByond)
        case 'uri':
          return Object.fromEntries(new URLSearchParams(queryByond).entries())
        default:
          return null
      }
    } catch (err) {
      this.logger.error(`Failed to getStatus with id ${serverPort}\n${err}`);
      return null
    }
  };

  async getPlayerlistExt(id: string): Promise<any> {
    const server = { ...servers[id] }
    server.topic = '?playerlist_ext'

    try {
      const queryByond = await fetchByond(server)

      switch (server.format) {
        case 'json':
          return await JSON.parse(queryByond)
        case 'uri':
          return Object.fromEntries(new URLSearchParams(queryByond).entries())
        default:
          return null
      }
    } catch (err) {
      this.logger.error(`Failed to getStatus with id ${id}\n${err}`);
      return null
    }
  }

  @Interval(20000)
  async handleUpdateByondStatus(): Promise<void> {
    this.logger.debug('handleUpdateByondStatus Called (every 20 seconds)');
    Object.keys(servers)
      ?.map(serverPort => {
        return [this.fetchStatus(serverPort), serverPort]
      })
      ?.forEach(async ([status, serverPort]) => {
        if (!status) 
          return
        const fetchedStatus = await status;
        if (!fetchedStatus)
          return
        await this.redis.set(`byond_${serverPort}_status`, JSON.stringify(fetchedStatus))
      })
    this.eventEmitter.emit(InternalEvent.ByondStatusUpdate)
  }

  
}