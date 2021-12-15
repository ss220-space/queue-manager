import { forwardRef, Module } from '@nestjs/common';
import { PassService } from "./pass.service";
import { EventsModule } from "../events/events.module";
import { IpLinkModule } from "../ipLink/ipLink.module";


@Module({
  imports: [forwardRef(() => EventsModule), IpLinkModule],
  providers: [PassService],
  exports: [PassService]
})
export class PassModule { }