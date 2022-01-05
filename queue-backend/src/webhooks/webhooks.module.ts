import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { AuthModule } from '../auth/auth.module'
import { IpLinkModule } from '../ipLink/ipLink.module'
import { PassModule } from '../pass/pass.module'

@Module({
  imports: [AuthModule, IpLinkModule, PassModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {

}
