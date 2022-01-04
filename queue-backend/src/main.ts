import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet'

async function bootstrap() {
  const isDev = process.env.NODE_ENV == 'development'

  const logger = []
  if (isDev) {
    logger.push('log', 'error', 'warn', 'verbose', 'debug')
  } else {
    logger.push('log', 'error', 'warn')
  }

  const app = await NestFactory.create(AppModule, { logger });

  app.use(helmet())
  const configService = app.get(ConfigService);
  if (isDev) {
    console.log('Running in dev, enabled CORS')
    app.enableCors()
  }

  const PORT = configService.get<number>('port');

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(PORT, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();