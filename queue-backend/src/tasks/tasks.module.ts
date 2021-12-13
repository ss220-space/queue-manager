import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { TasksService } from './tasks.service';
import { ByondModule } from '../byond/byond.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RedisModule,
    ByondModule,
    ConfigModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}