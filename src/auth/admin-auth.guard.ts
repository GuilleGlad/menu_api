import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type AdminRole = 'admin' | 'client';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing_bearer_token');
    }
    const token = auth.substring('Bearer '.length).trim();
    try {
      const payload = await this.jwt.verifyAsync(token);
      // minimal payload contract: { sub, role, email }
      if (!payload?.sub || !payload?.role)
        throw new UnauthorizedException('invalid_admin_token');
      // Collapse legacy roles: any non 'admin' becomes 'client'.
      const rawRole = String(payload.role || '').toLowerCase();
      const elevated = ['admin', 'owner', 'manager', 'editor', 'viewer'];
      const role: AdminRole = elevated.includes(rawRole) ? 'admin' : 'client';
      req.admin = { id: payload.sub, role, email: payload.email };
      return true;
    } catch (e) {
      throw new UnauthorizedException('invalid_or_expired_token');
    }
  }
}
