import { Injectable, Logger } from '@nestjs/common'
import { servers } from '@/queue.config.json'
import { fetchTopic } from 'byond-fetch'

@Injectable()
export class ByondService {
  private readonly logger = new Logger(ByondService.name);

  async fetchStatus(serverPort: string): Promise<any> {
    const server = { ... servers[serverPort] };
    const key = server.comms_password ? `&key=${server.comms_password}` : ''

    try {
      const queryByond = await fetchTopic({
        ip: server.ip,
        port: server.port,
        topic: `${server.topic}${key}`,
      })

      if (typeof queryByond !== 'string') return null

      switch (server.format) {
        case 'json':
          return await JSON.parse(queryByond)
        case 'uri':
          return Object.fromEntries(new URLSearchParams(queryByond).entries())
        default:
          return null
      }
    } catch (err) {
      this.logger.error(`Failed to getStatus with id ${serverPort}\n${err}`);
      return null
    }
  };

  async getPlayerlistExt(serverPort: string): Promise<string[] | undefined> {
    const server = { ...servers[serverPort] }
    const key = server.comms_password ? `&key=${server.comms_password}` : ''

    try {
      const queryByond = await fetchTopic({
        ip: server.ip,
        port: server.port,
        topic: `?playerlist_ext${key}`,
      })

      if (typeof queryByond !== 'string') return null

      const parsed = JSON.parse(queryByond)
      if (Array.isArray(parsed)) {
        return parsed
      } else {
        this.logger.error(`getPlayerlistExt not array with id ${serverPort}\n${queryByond}`)
        return null
      }
    } catch (err) {
      this.logger.error(`Failed to getPlayerlistExt with id ${serverPort}\n${err}`);
      return null
    }
  }
  
}