import {forwardRef, Module} from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from "./events.service";
import {PassModule} from "../pass/pass.module";

@Module({
  imports: [forwardRef(() => PassModule)],
  providers: [EventsGateway, EventsService],
  exports: [EventsService]
})
export class EventsModule {}