import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { logger } from './common/middleware/logger.middleware';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    QueueModule
  ],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(logger)
      .forRoutes('api');
  }
}