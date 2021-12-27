import {forwardRef, Module} from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { RedisModule } from 'nestjs-redis'
import { IptablesEventsModule } from '../iptablesEvents/iptablesEvents.module';
import { ByondModule } from '../byond/byond.module';
import { IpLinkModule } from '@/src/ipLink/ipLink.module';
import { PlayerListModule } from '../playerList/playerList.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { PassModule } from '../pass/pass.module'

@Module({
  imports: [
    IptablesEventsModule,
    RedisModule,
    ByondModule,
    IpLinkModule,
    PlayerListModule,
    PassModule,
    forwardRef(() => WebhooksModule),
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule { }