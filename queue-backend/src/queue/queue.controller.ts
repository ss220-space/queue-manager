import { Controller, Ip, Post, Body, HttpStatus, HttpException, UseGuards, Request, Get, Param } from '@nestjs/common';
import { QueueService } from './queue.service';
import { IpLinkService } from '../ipLink/ipLink.service';
import { RequestUserDto } from '../common/dto/requestUser.dto';
import { QueueStatusDto } from './dto/queueStatus.dto';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@Controller('/api/queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly ipLinkService: IpLinkService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToQueue(@Body() { serverPort }: ServerPortDto, @Ip() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.addToQueue(serverPort, ckey)) {
      throw new HttpException(`Client ${ip} already exists in the queue of ${serverPort}`, HttpStatus.CONFLICT);
    }
    return 'success'
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  async removeFromQueue(@Body() { serverPort }: ServerPortDto, @Ip() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.removeFromQueue(serverPort, ckey)) {
      throw new HttpException(`Client ${ip} doesn't exists in the queue of ${serverPort}`, HttpStatus.CONFLICT);
    }
    return 'success'
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:serverPort')
  async getQueueStatus(@Param() { serverPort  }: ServerPortDto, @Request() { user: { ckey } }: RequestUserDto): Promise<QueueStatusDto> {
    return await this.queueService.queueStatus(serverPort, ckey)
  }
}

