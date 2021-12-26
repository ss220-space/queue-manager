import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Interval } from '@nestjs/schedule';
import IORedis from 'ioredis';
import { PlayerListService } from '../playerList/playerList.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { servers } from '@/queue.config.json';
import { NonQueued, QueuePassed, QueueStatusDto } from './dto/queueStatus.dto';

@Injectable()
export class QueueService {
  private readonly redis: IORedis.Redis;
  constructor(
    private readonly redisService: RedisService,
    private readonly playerListService: PlayerListService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
  ) {
    this.redis = this.redisService.getClient()
  }

  private readonly logger = new Logger(QueueService.name);

  async addToQueue(serverPort: string, ckey: string): Promise<boolean> {
    const newEntry = {
      ckey,
    }

    if (!await this.redis.sadd(`byond_queue_${serverPort}_set`, JSON.stringify(newEntry))) {
      return false
    }
    await this.redis.rpush(`byond_queue_${serverPort}`, JSON.stringify(newEntry))
    return true
  }

  async removeFromQueue(serverPort: string, ckey: string): Promise<boolean> {
    const entry = {
      ckey,
    }

    if (!await this.redis.srem(`byond_queue_${serverPort}_set`, JSON.stringify(entry))) {
      return false
    }
    await this.redis.lrem(`byond_queue_${serverPort}`, 0, JSON.stringify(entry))
    return true
  }

  async queueStatus(serverPort: string, ckey: string): Promise<QueueStatusDto> {
    const ckeyEntry = JSON.stringify({ ckey })
    if (!await this.redis.sismember(`byond_queue_${serverPort}_set`, ckeyEntry)) {
      if (await this.playerListService.isPlayerInList(serverPort, ckey)) {
        const res = new QueuePassed()
        const serverInfo = servers[serverPort]
        res.connection_url = `byond://${serverInfo.connection_address}:${serverInfo.port}`
        return res
      } else {
        return new NonQueued()
      }
    }
    const pos = await this.redis.lpos(`byond_queue_${serverPort}`, ckeyEntry)
    const total = await this.redis.llen(`byond_queue_${serverPort}`)
    return { position: pos, total }
  }

  // @Interval(1000)
  async processQueues(): Promise<void> {
    for (const [serverPort, server] of Object.entries(servers)) {
      if (!server.queued) continue
      if (!(server as any).test) continue
      await this.processQueue(serverPort)
    }
  }

  private async processQueue(serverPort: string): Promise<void> {
    const queueTop = await this.redis.lindex(`byond_queue_${serverPort}`, 0)
    if (!queueTop) return
    
    const status = await this.playerListService.getSlotStats(serverPort)
    if (status.occupied >= status.max) return
    const newPlayer = await this.redis.lpop(`byond_queue_${serverPort}`)
    await this.redis.srem(`byond_queue_${serverPort}_set`, newPlayer)
    this.logger.log(`User ${newPlayer} got pass to ${serverPort}`)
    await this.playerListService.addFromQueue(serverPort, JSON.parse(newPlayer).ckey)
  }
}