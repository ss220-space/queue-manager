import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { QueueModule } from '../queue/queue.module'
import { PlayerListModule } from '../playerList/playerList.module'
import { PassModule } from '../pass/pass.module'
import { AdminService } from './admin.service'
import { StatusEventsModule } from '../status-events/status-events.module'

@Module({
  imports: [
    QueueModule,
    PlayerListModule,
    PassModule,
    StatusEventsModule,
  ],
  controllers: [
    AdminController,
  ],
  providers: [
    AdminService,
  ],
})
export class AdminModule {}