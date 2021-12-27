import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'

@Injectable()
export class PassService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient()
  }

  private readonly logger = new Logger(PassService.name)

  private redis: Redis

  async addCKeyPass(ckey: string, serverPort: string): Promise<void> {
    if (!await this.redis.sadd(`passes_${serverPort}`, ckey)) {
      this.logger.warn(`player '${ckey}' already has pass to ${serverPort}`)
      return
    }
    if (!await this.redis.sadd(`pass:${ckey}`, serverPort)) {
      this.logger.warn(`player '${ckey}' has mismatch in passes for ${serverPort}`)
      return
    }
    this.logger.debug(`Added pass for ${ckey} to ${serverPort}`)

    await this.notifyPassUpdate(ckey)
    this.eventEmitter.emit(InternalEvent.PassAdded, { ckey, serverPort })
  }

  async getServerPasses(serverPort: string): Promise<string[]> {
    return await this.redis.smembers(`passes_${serverPort}`)
  }

  async getPassesByCkey(ckey: string): Promise<string[]> {
    return await this.redis.smembers(`pass:${ckey}`)
  }

  private async notifyPassUpdate(ckey: string): Promise<void> {
    this.eventEmitter.emit(InternalEvent.PassUpdate, { ckey, passes: await this.redis.smembers(`pass:${ckey}`) })
  }

  async removeCKeyPass(ckey: string, serverPort: string): Promise<void> {
    await this.redis.srem(`passes_${serverPort}`, ckey)
    await this.redis.srem(`pass:${ckey}`, serverPort)
    this.logger.debug(`Removed pass for ${ckey} to ${serverPort}`)

    await this.notifyPassUpdate(ckey)
    this.eventEmitter.emit(InternalEvent.PassRemoved, { ckey, serverPort })
  }
}