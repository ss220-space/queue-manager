import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class QueueService {
  private readonly redis: any;
  constructor(
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient()
  }

  async addToQueue(server_port: string, ip: string): Promise<boolean> {
    const newEntry = {
      ip
    }

    if (!await this.redis.sadd(`byond_queue_${server_port}_set`, JSON.stringify(newEntry))) {
      return false
    }
    await this.redis.rpush(`byond_queue_${server_port}`, JSON.stringify(newEntry))
    return true
  }

  async removeFromQueue(server_port: string, ip: string): Promise<boolean> {
    const entry = {
      ip
    }

    if (!await this.redis.srem(`byond_queue_${server_port}_set`, JSON.stringify(entry))) {
      return false
    }
    await this.redis.lrem(`byond_queue_${server_port}`, 0, JSON.stringify(entry))
    return true
  }
}