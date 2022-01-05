import { Controller, Post, Param, Body, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { InternalGuard } from '../common/guards/internal.guard';
import { StatusDto } from './dto/status.dto';
import { WebhooksService } from './webhooks.service';
import { LobbyConnectDto, LobbyConnectResponse } from './dto/lobbyConnect.dto'

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhookService: WebhooksService,
  ) { }

  @Post('status/:serverPort')
  @UseGuards(InternalGuard)
  async pushStatus(@Param() { serverPort }: ServerPortDto, @Body() body: StatusDto): Promise<string> {

    if (! await this.webhookService.pushStatus(serverPort, body)) {
      throw new HttpException(`Something gone wild with ${serverPort}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return 'success'
  }

  @Post('lobby_connect')
  @UseGuards(InternalGuard)
  async lobbyConnect(@Body() { ckey, ip, targetServer }: LobbyConnectDto): Promise<LobbyConnectResponse> {
    return await this.webhookService.processLobbyConnect(ckey, ip, targetServer)
  }
}
