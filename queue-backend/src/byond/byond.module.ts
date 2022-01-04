import { Module } from '@nestjs/common';
import { ByondController } from './byond.controller';
import { ByondService } from './byond.service';
import { PassModule } from '../pass/pass.module';
import { RedisModule } from 'nestjs-redis';

@Module({
  imports: [
    PassModule,
  ],
  controllers: [ByondController],
  providers: [ByondService],
  exports: [ByondService],
})
export class ByondModule { }
