import { forwardRef, Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { IptablesEventsModule } from '../iptablesEvents/iptablesEvents.module';
import { IpLinkModule } from '../ipLink/ipLink.module';
import { PassController } from './pass.controller';


@Module({
  imports: [forwardRef(() => IptablesEventsModule), IpLinkModule],
  providers: [PassService],
  exports: [PassService],
  controllers: [PassController],
})
export class PassModule { }