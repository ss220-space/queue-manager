import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { getClientIp } from 'request-ip';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const internalIPs = this.configService.get<string[]>('internalIPs')
    return internalIPs.includes(getClientIp(request));
  }
}