import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from 'nestjs-redis';
import { logger } from './common/middleware/logger.middleware';
import { QueueModule } from './queue/queue.module';
import { TasksModule } from './tasks/tasks.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ByondModule } from './byond/byond.module';
import configuration from './config/configuration';

@Module({
  imports: [
    QueueModule,
    WebhooksModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
    RedisModule.register({
      url: process.env.REDIS_URL
    }),
    ByondModule,
    TasksModule,
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(logger)
      .forRoutes('api');
  }
}