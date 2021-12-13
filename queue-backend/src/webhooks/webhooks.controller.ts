import { Controller, Post, Param, Body, HttpStatus, HttpException, } from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { StatusDto } from './dto/status.dto';
import { WebhooksService } from './webhooks.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhooksService) { }

  @Post('status/:server_port')
  async pushStatus(@Param() { server_port }: ServerPortDto, @Body() body: StatusDto): Promise<string> {

    if (! await this.webhookService.pushStatus(server_port, body)) {
      throw new HttpException(`Something gone wild with ${server_port}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return "success"
  }
}
