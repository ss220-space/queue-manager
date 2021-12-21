import { Injectable, Logger } from '@nestjs/common'
import queueConfig from '@/queue.config.json'
import fetchByond from './http2byond'
import { servers } from '@/queue.config.json'
import { RedisService } from 'nestjs-redis'
import IORedis from 'ioredis';

@Injectable()
export class ByondService {
  constructor(
    private readonly redisService: RedisService,
    private readonly byondService: ByondService,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger();
  private readonly redis: IORedis.Redis;

  async getStatus(id: string): Promise<any> {
    const server = queueConfig.servers[id];

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
      console.error(`Failed to getStatus with id ${id}`);
      console.error(err);
      return null
    }
  };

  async getPlayerlistExt(id: string): Promise<any> {
    const server = { ...queueConfig.servers[id] }
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
      console.error(`Failed to getStatus with id ${id}`);
      console.error(err);
      return null
    }
  }

  //@Interval(20000)
  async handleUpdateByondStatus(): Promise<void> {
    this.logger.debug('handleUpdateByondStatus Called (every 20 seconds)');
    Object.keys(servers)
      ?.map(server_port => {
        return [this.byondService.getStatus(server_port), server_port]
      })
      ?.forEach(async ([status, server_port]) => {
        const fetchedStatus = await status;
        if (!fetchedStatus)
          return
        await this.redis.set(`byond_${server_port}_status`, JSON.stringify(fetchedStatus))
      })
  }
}