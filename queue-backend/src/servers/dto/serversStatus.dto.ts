import { ServerStatus } from './serverStatus.dto'

export type ServersStatus = {
  servers: ServerStatus[],
  now: number
}