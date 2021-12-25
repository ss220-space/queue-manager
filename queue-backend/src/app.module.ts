import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from 'nestjs-redis';
import { QueueModule } from './queue/queue.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ByondModule } from './byond/byond.module';
import configuration from './config/configuration';
import { RequestLoggingMiddleware } from './common/middleware/requestLogging.middleware';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('redis.url'),         // or use async method
      inject: [ConfigService],
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    AuthModule,
    ByondModule,
    WebhooksModule,
    QueueModule,
    UsersModule,
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('api');
  }
}