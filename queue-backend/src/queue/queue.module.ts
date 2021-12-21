import {forwardRef, Module} from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { RedisModule } from 'nestjs-redis'
import { EventsModule } from '../events/events.module';
import { ByondModule } from '../byond/byond.module';
import { IpLinkModule } from '@/src/ipLink/ipLink.module';
import { PlayerListModule } from '../playerList/playerList.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    EventsModule,
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