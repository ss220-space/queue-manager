import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import IORedis from 'ioredis';
import { Interval } from '@nestjs/schedule';
import { servers } from '@/queue.config.json';
import { ByondService } from '../byond/byond.service';
import { ConfigService } from '@nestjs/config';
import { PassService } from '../pass/pass.service';
import { WebhooksService } from '../webhooks/webhooks.service';

export class PlayerInfoDto {
  time: number
  new: boolean | null
}

export class PlayerListDto {
  [index: string]: PlayerInfoDto
}

@Injectable()
export class PlayerListService {
  constructor(
    private readonly redisService: RedisService,
    private readonly byondService: ByondService,
    private readonly configService: ConfigService,
    private readonly passService: PassService,
    private readonly webhooksService: WebhooksService,
  ) {
    this.redis = redisService.getClient()

  }
  private readonly redis: IORedis.Redis
  private readonly logger = new Logger(PlayerListService.name);

  async addFromQueue(serverPort: string, ckey: string): Promise<void> {
    const playerList = await this.getPlayerList(serverPort)
    playerList[ckey] = {
      new: true,
      time: Date.now(),
    }
    await this.savePlayerList(serverPort, playerList)
    await this.passService.addCKeyPass(ckey, parseInt(serverPort))
  }

  private async savePlayerList(serverPort: string, playerList: PlayerListDto): Promise<void> {
    await this.redis.set(`byond_${serverPort}_playerlist`, JSON.stringify(playerList))
  }

  async getSlotStats(serverPort: string) {
    const reservedSlots = await this.getNewPlayerCount(serverPort)
    const status = await this.webhooksService.getStatus(serverPort)

    return {
      max: status.max_slots,
      occupied: status.occupied_slots + reservedSlots,
    }
  }

  async getPlayerList(serverPort: string): Promise<PlayerListDto> {
    const playerListStr = await this.redis.get(`byond_${serverPort}_playerlist`)
    return playerListStr ? JSON.parse(playerListStr) : {}
  }

  async getNewPlayerCount(serverPort: string): Promise<number> {
    return Object.values(await this.getPlayerList(serverPort)).filter((player) => player.new).length
  }

  async isPlayerInList(serverPort: string, ckey: string): Promise<boolean> {
    const playerlist = await this.getPlayerList(serverPort)
    return Object.keys(playerlist).includes(ckey)
  }

  private async onPlayerRemoved(serverPort: string, ckey: string): Promise<void> {
    await this.passService.removeCKeyPass(ckey, parseInt(serverPort))
  }

  // @Interval(10000)
  async handleUpdateByondPlayerlist(): Promise<void> {
    this.logger.debug('handleUpdateByondPlayerlist Called (every 10 seconds)')
    const playerLists = Object.keys(servers)
      .filter(serverPort => {
        return servers[serverPort].queued && servers[serverPort].test
      })
      .map(serverPort => {
        this.logger.debug(`Fetching ${serverPort}`)
        return [this.byondService.getPlayerlistExt(serverPort), serverPort]
      })

    for (const [playerlist, serverPort] of playerLists) {
      if (!playerlist) {
        return
      }

      let fetchedPlayerlist: string[] = await playerlist;
      this.logger.debug('fetchedPlayerlist')
      this.logger.debug(fetchedPlayerlist)

      fetchedPlayerlist = fetchedPlayerlist.map(key => {
        return this.ckeySanitize(key)
      })

      const lastPlayerlist = await this.getPlayerList(<string>serverPort)
      this.logger.debug('lastPlayerlist')
      this.logger.debug(lastPlayerlist)

      const keyList = Object.keys(lastPlayerlist).length > 0 ? Object.keys(lastPlayerlist) : fetchedPlayerlist
      const newEntries = {}

      if (keyList) {
        for (const key of keyList) {
          const ckey = this.ckeySanitize(key)
          this.logger.debug(`Next player is ${ckey}`)
          if (!fetchedPlayerlist?.includes(ckey)) {
            const fiveMinutesAgo = Date.now() - this.configService.get<number>('queue.ghost_away_threshold')
            if (lastPlayerlist[ckey]?.time < fiveMinutesAgo) {
              await this.onPlayerRemoved(<string>serverPort, ckey)
              continue
            } else {
              newEntries[ckey] = lastPlayerlist[ckey]
            }
            continue
          }

          newEntries[ckey] = {
            time: Date.now(),
          }
        }
      }

      this.logger.debug('newEntries')
      this.logger.debug(newEntries)

      await this.savePlayerList(<string>serverPort, newEntries)

    }

  }

  ckeySanitize(key: string): string {
    return key.toLowerCase().replace(/[-_.\s]+/g, '').trim();
  };
}