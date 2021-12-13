import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
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

  @Interval(10000)
  async handleUpdateByondPlayerlist(): Promise<void> {
    this.logger.debug('handleUpdateByondPlayerlist Called (every 10 seconds)')
    Object.keys(servers)
      .filter(server_port => {
        return servers[server_port].queued && servers[server_port].test
      })
      .map(server_port => {
        this.logger.debug(`Fetching ${server_port}`)
        return [this.byondService.getPlayerlistExt(server_port), server_port]
      })
      .forEach(async ([playerlist, server_port]) => {
        if (!playerlist) {
          return
        }

        const fetchedPlayerlist: string[] = await playerlist;
        this.logger.debug('fetchedPlayerlist')
        this.logger.debug(fetchedPlayerlist)

        const lastPlayerlist = await this.redis.get(`byond_${server_port}_playerlist`)
        this.logger.debug('lastPlayerlist')
        this.logger.debug(lastPlayerlist)

        const lastPlayerlistJson = lastPlayerlist ? JSON.parse(lastPlayerlist) : {}
        const ckeyList = Object.keys(lastPlayerlistJson).length > 0 ? Object.keys(lastPlayerlistJson) : fetchedPlayerlist
        const newEntries = {}

        if (ckeyList) {
          for (const ckey of ckeyList) {
            this.logger.debug(`Next player is ${ckey}`)
            if (!fetchedPlayerlist?.includes(ckey)) {
              const fiveMinutesAgo = Date.now() - this.configService.get<number>('queue.ghost_away_threshold')
              if (lastPlayerlistJson[ckey]?.time < fiveMinutesAgo) {

                continue
              } else {
                newEntries[ckey] = lastPlayerlistJson[ckey]
              }
              continue
            }

            newEntries[ckey] = {
              time: Date.now()
            }
          }
        }

        this.logger.debug('newEntries')
        this.logger.debug(newEntries)

        await this.redis.set(`byond_${server_port}_playerlist`, JSON.stringify(newEntries))
      })
  }
}

