import { Module } from '@nestjs/common';
import { PlayerListService } from './playerList.service';
import { ByondModule } from '../byond/byond.module';
import { PassModule } from '../pass/pass.module';
import { RedisModule } from 'nestjs-redis';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ByondModule, PassModule, RedisModule, ConfigModule],
  providers: [PlayerListService],
  exports: [PlayerListService],
})
export class PlayerListModule {}