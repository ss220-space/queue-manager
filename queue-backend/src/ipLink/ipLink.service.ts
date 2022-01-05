import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import IORedis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { IpChangeEvent } from '../common/events/ip-change.event'
import { ConfigService } from '@nestjs/config'
import ipaddr, { IPv4, IPv6 } from 'ipaddr.js'

@Injectable()
export class IpLinkService {

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.redis = redisService.getClient()
  }

  redis: IORedis.Redis

  async linkIp(ckey: string, ip: string): Promise<void> {
    let parsedIp = ipaddr.parse(ip)
    if (parsedIp.kind()==='ipv6') {
      if ((parsedIp as IPv6).isIPv4MappedAddress()) {
        parsedIp = (parsedIp as IPv6).toIPv4Address()
      }
    }
    if (parsedIp.kind()!=='ipv4') return
    ip = (parsedIp as IPv4).toString()
    const added = await this.redis.zadd(`ip_of:${ckey}`, Date.now(), ip)
    if (added > 0) {
      const event: IpChangeEvent = {
        ip,
        ckey,
      }
      this.eventEmitter.emit(InternalEvent.IpAdded, event)
    }
    const ipExpire = this.configService.get<number>('queue.ip_expire')
    const removeUpTo = `(${Date.now() - ipExpire}`
    const toRemove = await this.redis.zrangebyscore(`ip_of:${ckey}`, '-inf', removeUpTo)
    if (toRemove) {
      await this.redis.zremrangebyscore(`ip_of:${ckey}`, '-inf', removeUpTo)
      for (ip of toRemove) {
        const event: IpChangeEvent = {ip, ckey}
        this.eventEmitter.emit(InternalEvent.IpRemoved, event)
      }
    }
  }

  async getIp(ckey: string): Promise<string[]> {
    const ipExpire = this.configService.get<number>('queue.ip_expire')
    return await this.redis.zrangebyscore(`ip_of:${ckey}`, Date.now() - ipExpire, '+inf')
  }
}