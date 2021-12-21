import { Module } from '@nestjs/common';
import { IpLinkService } from './ipLink.service';

@Module({
  providers: [IpLinkService],
  exports: [IpLinkService],
})
export class IpLinkModule {
}