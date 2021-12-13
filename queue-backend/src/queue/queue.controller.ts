import { Controller, Ip, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueRequestDto } from './dto/queueRequest.dto';

@Controller('/api/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) { }

  @Post('add')
  async addToQueue(@Body() { server_port }: QueueRequestDto, @Ip() ip: string): Promise<string> {
    if (! await this.queueService.addToQueue(server_port, ip.split(':').pop())) {
      throw new HttpException(`Client ${ip} already exists in the queue of ${server_port}`, HttpStatus.CONFLICT);
    }
    return "success"
  }

  @Post('remove')
  async removeFromQueue(@Body() { server_port }: QueueRequestDto, @Ip() ip: string): Promise<string> {
    if (! await this.queueService.removeFromQueue(server_port, ip.split(':').pop())) {
      throw new HttpException(`Client ${ip} doesn't exists in the queue of ${server_port}`, HttpStatus.CONFLICT);
    }
    return "success"
  }
}

