import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { IptablesEventsService } from '../iptablesEvents/iptablesEvents.service';
import { Redis } from 'ioredis';
import { IpLinkService } from '../ipLink/ipLink.service';

@Injectable()
export class PassService {
  constructor(
    private readonly redisService: RedisService,
    private readonly iptablesEventsService: IptablesEventsService,
    private readonly ipLinkService: IpLinkService,
  ) {
    this.redis = this.redisService.getClient()
  }

  private redis: Redis

  async addPass(playerIp: string, serverPort: number): Promise<void> {
    if (!await this.redis.sadd(`passes_${serverPort}`, playerIp)) {
      return
    }
    this.iptablesEventsService.onAddedPass(playerIp, serverPort)
  }

  async addCKeyPass(ckey: string, serverPort: number): Promise<void> {
    const ip = await this.ipLinkService.getIp(ckey)
    await this.addPass(ip, serverPort);
  }

  async getPasses(serverPort: number): Promise<string[]> {
    return await this.redis.smembers(`passes_${serverPort}`)
  }

  async removePass(playerIp: string, serverPort: number): Promise<void> {
    if (!await this.redis.srem(`passes_${serverPort}`, playerIp)) {
      return
    }
    this.iptablesEventsService.onRemovedPass(playerIp, serverPort)
  }

  async removeCKeyPass(ckey: string, serverPort: number): Promise<void> {
    const ip = await this.ipLinkService.getIp(ckey)
    await this.removePass(ip, serverPort);
  }
}