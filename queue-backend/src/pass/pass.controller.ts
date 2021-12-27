import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { RequestUserDto } from '../common/dto/requestUser.dto'
import { PassService } from './pass.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('pass')
export class PassController {
  constructor(private readonly passService: PassService) {}


  @UseGuards(JwtAuthGuard)
  @Get()
  async passes(@Request() { user: { ckey } }: RequestUserDto): Promise<string[]> {
    return await this.passService.getPassesByCkey(ckey)
  }
}
