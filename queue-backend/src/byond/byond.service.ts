import { Injectable } from '@nestjs/common'
import queueConfig from '@/queue.config.json'
import fetchByond from './http2byond'

@Injectable()
export class ByondService {
  async getStatus(id: string): Promise<any> {
    const server = queueConfig.servers[id];

    try {
      const queryByond = await fetchByond(server)

      switch (server.format) {
        case 'json':
          return await JSON.parse(queryByond)
        case 'uri':
          return Object.fromEntries(new URLSearchParams(queryByond).entries())
        default:
          return null
      }
    } catch (err) {
      console.error(`Failed to getStatus with id ${id}`);
      console.error(err);
      return null
    }
  };

  async getPlayerlistExt(id: string): Promise<any> {
    const server = { ...queueConfig.servers[id] }
    server.topic = '?playerlist_ext'

    try {
      const queryByond = await fetchByond(server)

      switch (server.format) {
        case 'json':
          return await JSON.parse(queryByond)
        case 'uri':
          return Object.fromEntries(new URLSearchParams(queryByond).entries())
        default:
          return null
      }
    } catch (err) {
      console.error(`Failed to getStatus with id ${id}`);
      console.error(err);
      return null
    }
  }
}