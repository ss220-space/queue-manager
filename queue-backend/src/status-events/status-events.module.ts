import { Module } from '@nestjs/common';
import { StatusEventsService } from './status-events.service';

@Module({
  providers: [StatusEventsService],
  exports: [StatusEventsService],
})
export class StatusEventsModule {}
