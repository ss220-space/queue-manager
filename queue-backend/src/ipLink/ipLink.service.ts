import { Injectable } from "@nestjs/common";
import { RedisService } from "nestjs-redis";
import IORedis from "ioredis";

@Injectable()
export class IpLinkService {

  constructor(private readonly redisService: RedisService) {
    this.redis = redisService.getClient()
  }

  redis: IORedis.Redis

  async linkIp(ckey: string, ip: string): Promise<void> {
    await this.redis.set(`ip_of:${ckey}`, ip.split(':').pop())
  }

  async getIp(ckey: string): Promise<string> {
    return await this.redis.get(`ip_of:${ckey}`)
  }
}