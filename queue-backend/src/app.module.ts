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
import { ServersModule } from './servers/servers.module';
import { StatusEventsModule } from './status-events/status-events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      cache: true,
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('redis'),         // or use async method
      inject: [ConfigService],
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    ByondModule,
    WebhooksModule,
    QueueModule,
    UsersModule,
    ServersModule,
    StatusEventsModule,
    AdminModule,
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}