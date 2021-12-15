import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from 'nestjs-redis'
import { ByondService } from '@/src/byond/byond.service'
import { servers } from '@/queue.config.json'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class TasksService {
  constructor(
    private readonly redisService: RedisService,
    private readonly byondService: ByondService,
    private readonly configService: ConfigService,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(TasksService.name);
  private readonly redis: any;

  //@Interval(20000)
  async handleUpdateByondStatus(): Promise<void> {
    this.logger.debug('handleUpdateByondStatus Called (every 20 seconds)');
    Object.keys(servers)
      .map(server_port => {
        return [this.byondService.getStatus(server_port), server_port]
      })
      .forEach(async ([status, server_port]) => {
        const fetchedStatus = await status;
        if (!fetchedStatus)
          return
        await this.redis.set(`byond_${server_port}_status`, JSON.stringify(fetchedStatus))
      })
  }

}

