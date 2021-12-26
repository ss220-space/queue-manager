import { Injectable, Logger } from '@nestjs/common';
import IORedis from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { servers } from '@/queue.config.json';
import { PlayerListService } from '../playerList/playerList.service';

export type ServerStatus = {
  mode: string;
  respawn: number;
  enter: number;
  roundtime: string;
  listed: string;
  mapname: string;
  players: number;
}

@Injectable()
export class ServersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly playerListService: PlayerListService,
  ) {
    this.redis = this.redisService.getClient()
  }
  private readonly logger = new Logger(ServersService.name);
  private readonly redis: IORedis.Redis;
  
  async server(serverPort: string) {
    const status =  await this.redis.get(`byond_${serverPort}_status`)

    const { mode, respawn, enter, roundtime, listed, mapname, players }: ServerStatus = JSON.parse(status) || {}
    const { name, port, queued, desc, connection_address } = servers[serverPort]

    const slots = queued ? await this.playerListService.getSlotStats(serverPort) : { max: 0, occupied: players}

    const stat = status ? {
      mode,
      roundtime,
      mapname,
      respawn: Boolean(respawn),
      enter: Boolean(enter),
      listed: Boolean(listed),
      slots,
    } : null
    
    return {
      name,
      desc,
      connection_address,
      port,
      queued,
      status: stat,
    }
  }

  async servers() {
    return await Promise.all(Object.keys(servers).map(async serverPort => {
      return await this.server(serverPort)
    }))
  }
}
