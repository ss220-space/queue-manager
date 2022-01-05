import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import IORedis from 'ioredis';
import { Interval } from '@nestjs/schedule';
import { servers } from '@/queue.config.json';
import { ByondService } from '../byond/byond.service';
import { ConfigService } from '@nestjs/config';
import { PassService } from '../pass/pass.service';
import { ckeySanitize, isStaff } from '../common/utils'
import { queuedServerList } from '../config/server-config'
import { Mutex, withTimeout } from 'async-mutex'
import { UsersService } from '../users/users.service'

export class PlayerInfoDto {
  time: number
  new?: boolean
  adminFlags?: number
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
    private readonly usersService: UsersService,
  ) {
    this.redis = redisService.getClient()

  }
  private readonly redis: IORedis.Redis
  private readonly logger = new Logger(PlayerListService.name);
  private readonly playerListMutex = withTimeout(new Mutex(), 20000, new Error('Player list mutation timed out'))

  async addFromQueue(serverPort: string, ckey: string): Promise<void> {
    const { adminFlags } = await this.usersService.getUserPrivilegesByCkey(ckey)
    // Mutex needed to avoid write conflicts
    await this.playerListMutex.runExclusive(async() => {
      const playerList = await this.getPlayerList(serverPort)
      playerList[ckey] = {
        adminFlags,
        new: true,
        time: Date.now(),
      }
      await this.savePlayerList(serverPort, playerList)
      await this.passService.addPassForCkey(ckey, serverPort)
    })
  }

  private async savePlayerList(serverPort: string, playerList: PlayerListDto): Promise<void> {
    await this.redis.set(`byond_${serverPort}_playerlist`, JSON.stringify(playerList))
  }

  async getSlotStats(serverPort: string) {
    const occupied = this.getPlayerCount(serverPort, false, true)
    return {
      max: servers[serverPort].max,
      occupied,
    }
  }

  async getPlayerList(serverPort: string): Promise<PlayerListDto> {
    const playerListStr = await this.redis.get(`byond_${serverPort}_playerlist`)
    return playerListStr ? JSON.parse(playerListStr) : {}
  }

  async getPlayerCount(serverPort: string, onlyNewPlayers = false, noStaff = true): Promise<number> {
    let players = Object.values(await this.getPlayerList(serverPort))
    if (onlyNewPlayers)
      players = players.filter((player) => player.new)
    if (noStaff)
      players = players.filter((player) => isStaff(player.adminFlags || 0))
    return players.length
  }

  async isPlayerInList(serverPort: string, ckey: string): Promise<boolean> {
    const playerList = await this.getPlayerList(serverPort)
    return Object.keys(playerList).includes(ckey)
  }

  private async removePlayer(serverPort: string, ckey: string): Promise<void> {
    this.logger.log(`[${ckey}] Removed from playerList of ${serverPort}`)
    await this.passService.removeCKeyPass(ckey, serverPort)
  }


  //@Interval(10000)
  async removeDanglingPlayers(): Promise<void> {
    await this.playerListMutex.runExclusive(async () => {
      this.logger.debug('removeDanglingPlayers Called (every 10 seconds)')
      for (const [serverPort, {queued}] of Object.entries(servers)) {
        if (!queued) continue

        const playerList = await this.getPlayerList(serverPort)
        const keyList = Object.keys(playerList)
        const newPlayerList = {}
        for (const key of keyList) {
          const ckey = ckeySanitize(key)
          this.logger.debug(`Next player is ${ckey}`)
          const fiveMinutesAgo = Date.now() - this.configService.get<number>('queue.ghost_away_threshold')
          if (playerList[ckey]?.time < fiveMinutesAgo) {
            await this.removePlayer(<string>serverPort, ckey)
          } else {
            newPlayerList[ckey] = playerList[ckey]
          }
        }

        await this.savePlayerList(<string>serverPort, newPlayerList)
      }
    })
  }
  @Interval(10000)
  async handleUpdateByondPlayerlist(): Promise<void> {
    await this.playerListMutex.runExclusive(async () => {

      this.logger.debug('handleUpdateByondPlayerlist Called (every 10 seconds)')
      const playerLists = queuedServerList
        .map((server) => `${server.port}`)
        .map(serverPort => {
          this.logger.debug(`Fetching ${serverPort}`)
          return [this.byondService.getPlayerlistExt(serverPort), serverPort]
        })

      for (const [playerlist, serverPort] of playerLists) {
        let fetchedByondPlayerList: string[] = await playerlist;

        if (!fetchedByondPlayerList) {
          continue
        }
        this.logger.debug('fetchedByondPlayerList')
        this.logger.debug(fetchedByondPlayerList)

        fetchedByondPlayerList = fetchedByondPlayerList.map(key => {
          return ckeySanitize(key)
        })

        const lastPlayerList = await this.getPlayerList(<string>serverPort)
        this.logger.debug('lastPlayerList')
        this.logger.debug(lastPlayerList)

        const keyList = Object.keys(lastPlayerList).length > 0 ? Object.keys(lastPlayerList) : fetchedByondPlayerList
        const updatedPlayerList: PlayerListDto = {}

        if (keyList) {
          for (const key of keyList) {
            const ckey = ckeySanitize(key)
            this.logger.debug(`Next player is ${ckey}`)

            // If player present in server player list
            if (fetchedByondPlayerList?.includes(ckey)) {
              // player was not on player list before, but have access, add pass anyway

              let adminFlags;

              if (!lastPlayerList[ckey]) {
                this.logger.log(`[${ckey}] New in playerList of ${serverPort}`)
                await this.passService.addPassForCkey(ckey, <string>serverPort)
                adminFlags = (await this.usersService.getUserPrivilegesByCkey(ckey)).adminFlags
              } else {
                adminFlags = lastPlayerList[ckey].adminFlags
              }

              updatedPlayerList[ckey] = {
                time: Date.now(),
                adminFlags,
              }
            } else {
              const lastPresenceTime = lastPlayerList[ckey]?.time
              const allowedAwayTime = this.configService.get<number>('queue.ghost_away_threshold')
              if (Date.now() - lastPresenceTime > allowedAwayTime) {
                await this.removePlayer(<string>serverPort, ckey)
              } else {
                updatedPlayerList[ckey] = lastPlayerList[ckey]
              }
            }
          }
        }

        this.logger.debug('updatedPlayerList')
        this.logger.debug(updatedPlayerList)

        await this.savePlayerList(<string>serverPort, updatedPlayerList)
      }

    })
  }
}