import {servers} from '@/queue.config.json'

export const queuedServerList = Object.values(servers).filter(({queued}) => queued)
export const serverList = Object.values(servers)