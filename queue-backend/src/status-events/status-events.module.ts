import { Module } from '@nestjs/common';
import { StatusEventsService } from './status-events.service';
import { IpLinkModule } from '../ipLink/ipLink.module'
import { PassModule } from '../pass/pass.module'

@Module({
  imports: [PassModule, IpLinkModule],
  providers: [StatusEventsService],
  exports: [StatusEventsService],
})
export class StatusEventsModule {}
