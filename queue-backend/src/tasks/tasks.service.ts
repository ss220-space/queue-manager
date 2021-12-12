import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { RedisService } from 'nestjs-redis';
import { ByondService } from '@/src/byond/byond.service';
import { servers } from '@/queue.config.json'

@Injectable()
export class TasksService {
  constructor(
    private readonly redisService: RedisService,
    private readonly byondService: ByondService
  ) { 
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(TasksService.name);
  private readonly redis: any;

  @Timeout(10000)
  async handleUpdateByondStatus(): Promise<void> {
    this.logger.debug('Called every 10 seconds');
    const statuses = Object.keys(servers).map(server_port => {
      return [this.byondService.getStatus(server_port),server_port]
    });

    statuses.forEach(async ([status, server_port]) =>  {
      const getStatus = await status;
      if(!getStatus)
        return
      await this.redis.set(`byond_${server_port}_status`, JSON.stringify(getStatus))
    })
  }
}

