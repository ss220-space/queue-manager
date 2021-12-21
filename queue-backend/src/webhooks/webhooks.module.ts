import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { UserAuthModule } from '../userAuth/userAuth.module';

@Module({
  imports: [UserAuthModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {

}
