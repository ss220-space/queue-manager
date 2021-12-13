import {Injectable} from "@nestjs/common";
import {RedisService} from "nestjs-redis";
import {EventsService} from "../events/events.service";
import IORedis from "ioredis";

@Injectable()
export class PassService {
  constructor(private readonly redisService: RedisService,
              private readonly eventsService: EventsService) {
    this.redis = redisService.getClient()
  }

  private redis: IORedis.Redis

  async addPass(playerIp: string, serverPort: number): Promise<void> {
    if (!await this.redis.sadd(`passes_${serverPort}`, playerIp)) {
      return
    }
    this.eventsService.onAddedPass(playerIp, serverPort)
  }

  async getPasses(serverPort: number): Promise<string[]> {
    return await this.redis.smembers(`passes_${serverPort}`)
  }

  async removePass(playerIp: string, serverPort: number): Promise<void> {
    if (!await this.redis.srem(`passes_${serverPort}`, playerIp)) {
      return
    }
    this.eventsService.onRemovedPass(playerIp, serverPort)
  }
}