import { Controller, Sse, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../roles/roles.guard'
import { AdminFlag } from '../roles/adminFlag.enum'
import { Roles } from '../roles/roles.decorator'
import { merge, Observable, map } from 'rxjs'
import { AdminService } from './admin.service'
import { MessageEvent } from '@nestjs/common'
import { StatusEventsService } from '../status-events/status-events.service'


@Controller('admin')
export class AdminController {

  constructor(
    private readonly adminService: AdminService,
    private readonly statusEventsService: StatusEventsService,
  ) {
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminFlag.R_ADMIN, AdminFlag.R_SERVER)
  @Sse('events')
  async adminEvents(): Promise<Observable<MessageEvent>> {
    return merge(
      await this.adminService.playerUpdateEvents(),
      await this.adminService.queueUpdateEvents(),
      this.statusEventsService.statusEventSubject.asObservable(),
    ).pipe(
      map((event) => {
        return {
          ...event,
          id: `${Date.now()}`,
        }
      }),
    )
  }
}