import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthorizeDto } from './dto/authorize.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('authorize')
  async authorizeUser(@Body() body: AuthorizeDto): Promise<string> {
    return this.authService.generateUserToken(body.ckey)
  }
}
