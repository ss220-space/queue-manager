import {Module} from '@nestjs/common';
import {PassService} from "./pass.service";
import {EventsModule} from "../events/events.module";


@Module({
  imports: [EventsModule],
  providers: [PassService],
  exports: [PassService]
})
export class PassModule {}