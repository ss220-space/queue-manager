import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import IORedis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { IpChangeEvent } from '../common/events/ip-change.event'

@Injectable()
export class IpLinkService {

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.redis = redisService.getClient()
  }

  redis: IORedis.Redis

  async linkIp(ckey: string, ip: string): Promise<void> {
    ip = ip.split(':').pop()
    const prev = await this.redis.getset(`ip_of:${ckey}`, ip)
    if (prev !== ip) {
      const event: IpChangeEvent = {
        newIp: ip,
        oldIp: prev,
        ckey,
      }
      this.eventEmitter.emit(InternalEvent.IpChanged, event)
    }
  }

  async getIp(ckey: string): Promise<string[]> {
    const ip = await this.redis.get(`ip_of:${ckey}`)
    return [ip]
  }
}