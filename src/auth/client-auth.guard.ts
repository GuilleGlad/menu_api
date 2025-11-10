import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientService } from '../client/client.service';

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(private readonly clientService: ClientService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing_bearer_token');
    }
    const token = auth.substring('Bearer '.length).trim();
    const session = this.clientService.validateToken(token);
    if (!session) throw new UnauthorizedException('invalid_or_expired_token');
    // attach session to request for downstream usage
    req.clientSession = session;
    return true;
  }
}
