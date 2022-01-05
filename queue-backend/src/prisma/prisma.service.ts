import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    let log
    if (process.env.NODE_ENV !== 'development') {
      log = ['warn', 'error', 'info']
    } else {
      log = ['query', 'warn', 'error', 'info']
    }
    super({
      log,
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      await app.close();
    });    
  }
}