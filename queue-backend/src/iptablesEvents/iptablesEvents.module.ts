import { forwardRef, Module } from '@nestjs/common';
import { IptablesEventsGateway } from './iptablesEvents.gateway';
import { IptablesEventsService } from './iptablesEvents.service';
import { PassModule } from '../pass/pass.module';

@Module({
  imports: [forwardRef(() => PassModule)],
  providers: [IptablesEventsGateway, IptablesEventsService],
  exports: [IptablesEventsService],
})
export class IptablesEventsModule { }