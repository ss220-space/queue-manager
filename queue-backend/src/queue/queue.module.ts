import {forwardRef, Module} from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { RedisModule } from 'nestjs-redis'
import { IptablesEventsModule } from '../iptablesEvents/iptablesEvents.module';
import { ByondModule } from '../byond/byond.module';
import { IpLinkModule } from '@/src/ipLink/ipLink.module';
import { PlayerListModule } from '../playerList/playerList.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    IptablesEventsModule,
    RedisModule,
    ByondModule,
    IpLinkModule,
    PlayerListModule,
    forwardRef(() => WebhooksModule),
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule { }