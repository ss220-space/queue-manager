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

  async pushStatus(server_port: string, body: StatusDto): Promise<boolean> {
    await this.redis.set(`byond_status_${server_port}`, JSON.stringify(body))
    return true
  }
}