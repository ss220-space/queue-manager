import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CkeyDto } from '../common/dto/ckey.dto';
import { InternalGuard } from '../common/guards/internal.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDto } from './dto/user.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('authorize')
  @UseGuards(InternalGuard)
  async authorizeUser(@Body() { ckey }: CkeyDto): Promise<string> {
    return this.authService.generateUserToken(ckey)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): UserDto {
    return req.user;
  }
}
