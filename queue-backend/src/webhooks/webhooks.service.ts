import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { StatusDto } from './dto/status.dto';

@Injectable()
export class WebhooksService {
  private readonly redis: any;
  constructor(
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient()
  }

  async pushStatus(serverPort: string, body: StatusDto): Promise<boolean> {
    await this.redis.set(`byond_status_${serverPort}`, JSON.stringify(body))
    return true
  }

  async getStatus(serverPort: string): Promise<StatusDto> {
    return JSON.parse(await this.redis.get(`byond_status_${serverPort}`))
  }
}