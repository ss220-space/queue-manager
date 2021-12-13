import { forwardRef, Module } from '@nestjs/common';
import { PassService } from "./pass.service";
import { EventsModule } from "../events/events.module";


@Module({
  imports: [forwardRef(() => EventsModule)],
  providers: [PassService],
  exports: [PassService]
})
export class PassModule { }