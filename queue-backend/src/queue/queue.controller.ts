import { Controller, Post, Body, HttpStatus, HttpException, UseGuards, Request, Get} from '@nestjs/common';
import { QueueService } from './queue.service';
import { IpLinkService } from '../ipLink/ipLink.service';
import { RequestUserDto } from '../common/dto/requestUser.dto';
import { ServerQueueStatus } from './dto/queueStatus.dto';
import { ServerPortDto } from '../common/dto/serverPort.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotBannedGuard } from '../auth/guards/not-banned.guard';
import { RealIp } from '../common/decorators/real-ip.decorator';


@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly ipLinkService: IpLinkService,
  ) { }

  @UseGuards(JwtAuthGuard, NotBannedGuard)
  @Post('add')
  async addToQueue(@Body() { serverPort }: ServerPortDto, @RealIp() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.addToQueue(serverPort, ckey)) {
      throw new HttpException(`Client ${ip} already exists in the queue of ${serverPort}`, HttpStatus.CONFLICT);
    }
    return 'success'
  }

  @UseGuards(JwtAuthGuard, NotBannedGuard)
  @Post('remove')
  async removeFromQueue(@Body() { serverPort }: ServerPortDto, @RealIp() ip: string, @Request() { user: { ckey } }: RequestUserDto): Promise<string> {
    await this.ipLinkService.linkIp(ckey, ip)
    if (! await this.queueService.removeFromQueue(serverPort, ckey)) {
      throw new HttpException(`Client ${ip} doesn't exists in the queue of ${serverPort}`, HttpStatus.CONFLICT);
    }
    return 'success'
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getQueueStatus(@Request() { user: { ckey } }: RequestUserDto): Promise<ServerQueueStatus> {
    return await this.queueService.queueStatus(ckey)
  }
}

