import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { RedisModule } from 'nestjs-redis'
import { EventsModule } from '../events/events.module';
import { ByondModule } from '../byond/byond.module';
import { IpLinkModule } from "@/src/ipLink/ipLink.module";

@Module({
  imports: [
    EventsModule,
    RedisModule,
    ByondModule,
    IpLinkModule
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule { }