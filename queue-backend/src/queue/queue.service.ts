import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import IORedis from 'ioredis';
import { PlayerListService } from '../playerList/playerList.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { servers } from '@/queue.config.json';
import { ServerQueueStatus } from './dto/queueStatus.dto';
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { QueuesState } from '../common/queues-state'
import { Interval } from '@nestjs/schedule'
import { queuedServerList } from '../config/server-config'
import { PassService } from '../pass/pass.service'



@Injectable()
export class QueueService {
  private readonly redis: IORedis.Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly playerListService: PlayerListService,
    private readonly passService: PassService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient()
  }

  private readonly logger = new Logger(QueueService.name);

  async addToQueue(serverPort: string, ckey: string): Promise<boolean> {
    if (await this.passService.checkPass(ckey, serverPort)) return false

    const newEntry = {
      ckey,
    }

    if (!await this.redis.sadd(`byond_queue_${serverPort}_set`, JSON.stringify(newEntry))) {
      return false
    }
    await this.redis.rpush(`byond_queue_${serverPort}`, JSON.stringify(newEntry))
    await this.notifyQueuesUpdate()
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
    await this.notifyQueuesUpdate()
    return true
  }

  async queueStatus(ckey: string): Promise<ServerQueueStatus> {
    const ckeyEntry = JSON.stringify({ckey})

    const result = [];

    for (const {port} of queuedServerList) {
      if (!await this.redis.sismember(`byond_queue_${port}_set`, ckeyEntry)) {
        continue
      }

      const pos = await this.redis.lpos(`byond_queue_${port}`, ckeyEntry)
      const total = await this.redis.llen(`byond_queue_${port}`)

      console.log(pos)
      result.push({position: pos, total, serverPort: `${port}`})
    }

    console.log(result)
    return result
  }

  async queueSize(serverPort: string): Promise<number> {
    return await this.redis.llen(`byond_queue_${serverPort}`) || 0
  }

  @Interval(10000)
  async processQueues(): Promise<void> {
    let hasChanges = false
    for (const [serverPort, server] of Object.entries(servers)) {
      if (!server.queued) continue
      if (!(server as any).test) continue
      hasChanges = hasChanges || await this.processQueue(serverPort)
    }
    if (hasChanges) {
      await this.notifyQueuesUpdate()
    }
  }

  async getQueue(serverPort: string): Promise<string[]> {
    return (await this.redis.lrange(`byond_queue_${serverPort}`, 0, -1)).map((data) => JSON.parse(data).ckey)
  }

  async getQueues(): Promise<QueuesState> {
    return await Promise.all(Object.entries(servers)
        .filter(([, {queued}]) => queued)
        .map(async ([port]) => { return { serverPort: port, players: await this.getQueue(port) } }),
    )
  }

  private async notifyQueuesUpdate() {
    this.eventEmitter.emit(InternalEvent.QueuesUpdate, await this.getQueues())
  }

  private async processQueue(serverPort: string): Promise<boolean> {
    const queueTop = await this.redis.lindex(`byond_queue_${serverPort}`, 0)
    if (!queueTop) return false

    const status = await this.playerListService.getSlotStats(serverPort)
    if (!status) return false
    if (status.occupied >= status.max) return false
    const newPlayer = await this.redis.lpop(`byond_queue_${serverPort}`)
    await this.redis.srem(`byond_queue_${serverPort}_set`, newPlayer)
    this.logger.log(`User ${newPlayer} got pass to ${serverPort}`)
    await this.playerListService.addFromQueue(serverPort, JSON.parse(newPlayer).ckey)
    return true
  }
}