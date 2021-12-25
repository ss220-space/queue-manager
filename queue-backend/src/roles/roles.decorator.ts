import { SetMetadata } from '@nestjs/common';
import { AdminFlag } from './adminFlag.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminFlag[]) => SetMetadata(ROLES_KEY, roles);