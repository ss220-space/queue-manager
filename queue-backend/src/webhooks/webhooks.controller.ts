import { Controller, Post, Param, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { StatusDto } from './dto/status.dto';
import { WebhooksService } from './webhooks.service';
import { AuthorizeDto } from './dto/authorize.dto';
import { AuthService } from '../auth/auth.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhookService: WebhooksService,
    private readonly authService: AuthService,
  ) { }

  @Post('status/:server_port')
  async pushStatus(@Param() { server_port }: ServerPortDto, @Body() body: StatusDto): Promise<string> {

    if (! await this.webhookService.pushStatus(server_port, body)) {
      throw new HttpException(`Something gone wild with ${server_port}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return 'success'
  }

  @Post('authorize')
  async authorizeUser(@Body() body: AuthorizeDto): Promise<string> {
    return this.authService.generateUserToken(body.ckey)
  }
}
