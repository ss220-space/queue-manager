import { TickerState } from '@/src/common/enums/tickerState.enum';

export class ServerStatus {
  name: string;
  desc: string;
  connection_address: string;
  port: string;
  queued: boolean;
  whitelisted: boolean;
  order: number;
  status?: {
    ticker_state: TickerState;
    mode: string;
    roundtime: string;
    mapname: string;
    respawn: boolean;
    enter: boolean;
    listed: boolean;
    slots: {
      max: number;
      occupied: number;
    };
    queueSize: number;
    date: Date;
  };
}