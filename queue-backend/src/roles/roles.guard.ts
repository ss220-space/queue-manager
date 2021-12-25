import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminFlag } from './adminFlag.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminFlag[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log(requiredRoles)
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.every((flag) => this.hasFlag(user.adminFlags, flag));
  }

  hasFlag(flags: number, requiredFlag: AdminFlag): boolean {
    console.log(`Flags ${flags} and required ${requiredFlag}`)
    return (flags & requiredFlag) !== 0
  }
}