import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RedisService } from 'nestjs-redis';
import { ByondService } from '@/src/byond/byond.service';
import { servers } from '@/queue.config.json'
import { ConfigService } from '@nestjs/config';

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
    const statuses = Object.keys(servers).map(server_port => {
      return [this.byondService.getStatus(server_port), server_port]
    })

    statuses.forEach(async ([status, server_port]) => {
      const getStatus = await status;
      if (!getStatus)
        return
      await this.redis.set(`byond_${server_port}_status`, JSON.stringify(getStatus))
    })
  }

  @Interval(10000)
  async handleUpdateByondPlayerlist(): Promise<void> {
    this.logger.debug('handleUpdateByondPlayerlist Called (every 10 seconds)');
    const serversToFetch = Object.keys(servers).map(server_port => {
      if (servers[server_port].queued && servers[server_port].test) {
        this.logger.debug(`Fetching ${server_port}`)
        return [this.byondService.getPlayerlistExt(server_port), server_port]
        
      }
      return [null, server_port]
      
    })

    serversToFetch.forEach(async ([playerlist, server_port]) => {
      if (!playerlist)
        return
      const getPlayerlist: string[] = await playerlist;
      // if (!getPlayerlist) {
      //   return
      // }
        
      this.logger.debug('getPlayerlist')
      this.logger.debug(getPlayerlist)

      const lastPlayers = await this.redis.get(`byond_${server_port}_playerlist`)
      this.logger.debug('LastPlayers')
      this.logger.debug(lastPlayers)

      const lastPlayersJson = lastPlayers ? JSON.parse(lastPlayers) : {}
      const list = Object.keys(lastPlayersJson).length > 0 ? Object.keys(lastPlayersJson) : getPlayerlist
      const newEntries = {}
      
      if (list) {
        for (const player of list) {
          this.logger.debug(`Next player is ${player}`)
          if(!getPlayerlist?.includes(player)) {
            const fiveMinutesAgo = Date.now() - this.configService.get<number>('queue.ghost_away_threshold')
            if(lastPlayersJson[player]?.time < fiveMinutesAgo) {
              continue
            } 
            newEntries[player] = lastPlayersJson[player]
            continue
          }
          
          newEntries[player] = {
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

