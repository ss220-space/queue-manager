import { Controller, Ip, Post, Body, HttpStatus, HttpException, UseGuards, Request } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueRequestDto } from './dto/queueRequest.dto';
import { AuthGuard } from "@nestjs/passport";
import { IpLinkService } from "../ipLink/ipLink.service";
import { RequestUserDto } from "../common/dto/requestUser.dto";

@Controller('/api/queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly ipLinkService: IpLinkService
  ) { }

  @UseGuards(AuthGuard("jwt"))
  @Post('add')
  async addToQueue(@Body() { server_port }: QueueRequestDto, @Ip() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.addToQueue(server_port, ckey)) {
      throw new HttpException(`Client ${ip} already exists in the queue of ${server_port}`, HttpStatus.CONFLICT);
    }
    return "success"
  }

  @UseGuards(AuthGuard("jwt"))
  @Post('remove')
  async removeFromQueue(@Body() { server_port }: QueueRequestDto, @Ip() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.removeFromQueue(server_port, ckey)) {
      throw new HttpException(`Client ${ip} doesn't exists in the queue of ${server_port}`, HttpStatus.CONFLICT);
    }
    return "success"
  }
}

