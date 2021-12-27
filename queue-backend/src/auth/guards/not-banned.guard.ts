import { RequestUserDto } from '@/src/common/dto/requestUser.dto';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class NotBannedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user }: RequestUserDto = context.switchToHttp().getRequest();
    return !user.hasActiveBan;
  }
}