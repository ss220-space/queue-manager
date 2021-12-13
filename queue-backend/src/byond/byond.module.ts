import { Module } from '@nestjs/common';
import { ByondController } from './byond.controller';
import { ByondService } from './byond.service';

@Module({
  controllers: [ByondController],
  providers: [ByondService],
  exports: [ByondService]
})
export class ByondModule { }
