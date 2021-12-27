import { Module } from '@nestjs/common';
import { ByondModule } from '../byond/byond.module';
import { PlayerListModule } from '../playerList/playerList.module';
import { StatusEventsModule } from '../status-events/status-events.module';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { QueueModule } from '../queue/queue.module';
import { IpLinkModule } from '../ipLink/ipLink.module';
import { PassModule } from '../pass/pass.module';

@Module({
  imports: [
    ByondModule,
    PlayerListModule,
    StatusEventsModule,
    QueueModule,
    IpLinkModule,
    PassModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule { }
