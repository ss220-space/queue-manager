import { Module } from '@nestjs/common';
import { IptablesEventsGateway } from './iptablesEvents.gateway';
import { IptablesEventsService } from './iptablesEvents.service';
import { PassModule } from '../pass/pass.module';
import { IpLinkModule } from '../ipLink/ipLink.module'

@Module({
  imports: [
    PassModule,
    IpLinkModule,
  ],
  providers: [IptablesEventsGateway, IptablesEventsService],
  exports: [IptablesEventsService],
})
export class IptablesEventsModule { }