import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "nestjs-redis";
import IORedis from "ioredis";
import { Interval } from "@nestjs/schedule";
import { servers } from "@/queue.config.json";
import { ByondService } from "../byond/byond.service";
import { ConfigService } from "@nestjs/config";
import { PassService } from "../pass/pass.service";

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
    private readonly passService: PassService
  ) {
    this.redis = redisService.getClient()

  }
  private readonly redis: IORedis.Redis
  private readonly logger = new Logger(PlayerListService.name);

  async addFromQueue(server_port: string, ckey: string): Promise<void> {
    const playerList = await this.getPlayerList(server_port)
    playerList[ckey] = {
      new: true,
      time: Date.now()
    }
    await this.savePlayerList(server_port, playerList)
    await this.passService.addCKeyPass(ckey, parseInt(server_port))
  }

  private async savePlayerList(server_port: string, playerList: PlayerListDto): Promise<void> {
    await this.redis.set(`byond_${server_port}_playerlist`, JSON.stringify(playerList))
  }


  async getPlayerList(server_port: string): Promise<PlayerListDto> {
    const playerListStr = await this.redis.get(`byond_${server_port}_playerlist`)
    return playerListStr ? JSON.parse(playerListStr) : {}
  }

  async getNewPlayerCount(server_port: string): Promise<number> {
    return Object.values(await this.getPlayerList(server_port)).filter((player) => player.new).length
  }

  private async onPlayerRemoved(server_port: string, ckey: string): Promise<void> {
    await this.passService.removeCKeyPass(ckey, parseInt(server_port))
  }

  @Interval(10000)
  async handleUpdateByondPlayerlist(): Promise<void> {
    this.logger.debug('handleUpdateByondPlayerlist Called (every 10 seconds)')
    const playerLists = Object.keys(servers)
      .filter(server_port => {
        return servers[server_port].queued && servers[server_port].test
      })
      .map(server_port => {
        this.logger.debug(`Fetching ${server_port}`)
        return [this.byondService.getPlayerlistExt(server_port), server_port]
      })

    for (const [playerlist, server_port] of playerLists) {
      if (!playerlist) {
        return
      }

      const fetchedPlayerlist: string[] = await playerlist;
      this.logger.debug('fetchedPlayerlist')
      this.logger.debug(fetchedPlayerlist)

      const lastPlayerlist = await this.getPlayerList(<string>server_port)
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
              await this.onPlayerRemoved(<string>server_port, ckey)
              continue
            } else {
              newEntries[ckey] = lastPlayerlist[ckey]
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

      await this.savePlayerList(<string>server_port, newEntries)

    }

  }

  ckeySanitize(key: string): string {
    return key.toLowerCase().replace(/[-_.\s]+/g, '').trim();
  };
}