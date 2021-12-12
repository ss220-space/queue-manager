import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { ByondService } from '@/src/byond/byond.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    RedisModule,
  ],
  providers: [TasksService, ByondService],
})
export class TasksModule {}