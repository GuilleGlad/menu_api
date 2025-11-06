import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';

@Controller({ path: 'client', version: '1' })
export class ClientController {
  constructor(private readonly service: ClientService) {}

  @Post('sessions')
  async createSession(@Body() body: CreateSessionDto) {
    const s = await this.service.createGuestSession(body);
    return { token: s.token, expires_at: s.expires_at, context: s.context };
  }

  @Post('sessions/refresh')
  async refreshSession(@Body() body: RefreshSessionDto) {
    const s = await this.service.refreshSession(body.token);
    if (!s) return { error: 'invalid_token' };
    return { token: s.token, expires_at: s.expires_at, context: s.context };
  }

  @Delete('sessions')
  async deleteSession(@Body() body: RefreshSessionDto) {
    const ok = await this.service.deleteSession(body.token);
    return { ok };
  }
}
