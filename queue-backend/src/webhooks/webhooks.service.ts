import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { StatusDto } from './dto/status.dto';
import { IpLinkService } from '../ipLink/ipLink.service'
import { PassService } from '../pass/pass.service'
import { servers } from '@/queue.config.json'
import { AuthService } from '../auth/auth.service'
import { LobbyConnectResponse } from './dto/lobbyConnect.dto'

@Injectable()
export class WebhooksService {
  private readonly redis: any;
  constructor(
    private readonly redisService: RedisService,
    private readonly ipLinkService: IpLinkService,
    private readonly passService: PassService,
    private readonly authService: AuthService,
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

  async processLobbyConnect(ckey: string, ip: string, targetServer: string): Promise<LobbyConnectResponse> {
    await this.ipLinkService.linkIp(ckey, ip)
    const targetPort = targetServer.split(':').pop() || ''
    if (await this.passService.checkPass(ckey, targetPort)) {
      const server = servers[targetPort]
      return {
        redirect: `byond://${server.connection_address}:${server.port}`,
      }
    } else {
      const token = await this.authService.generateUserToken(ckey)
      return {
        token,
      }
    }
  }
}