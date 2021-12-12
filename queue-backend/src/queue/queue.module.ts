import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { TasksModule } from '../tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule} from 'nestjs-redis'
import { EventsModule } from '../events/events.module';
import { ByondService } from '../byond/byond.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    RedisModule.register({
      url: process.env.REDIS_URL
    }),
    EventsModule,
    TasksModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, ByondService],
})
export class QueueModule {}