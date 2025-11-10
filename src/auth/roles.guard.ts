import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const role: string | undefined = req?.admin?.role;
    if (!role) throw new ForbiddenException('admin_role_required');
    // Legacy role mapping: treat previous elevated roles as 'admin'.
    const legacyAdmin = ['owner', 'manager', 'editor', 'viewer'];
    const effective =
      role === 'admin' || legacyAdmin.includes(role) ? 'admin' : 'client';
    if (required.includes('admin') && effective !== 'admin') {
      throw new ForbiddenException('insufficient_role');
    }
    return true;
  }
}
