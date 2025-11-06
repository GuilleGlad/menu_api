import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';

type Session = {
  token: string;
  expires_at: string; // ISO
  context: { restaurant_id: string; table_id?: string };
};

@Injectable()
export class ClientService {
  // in-memory sessions store: token -> session
  private sessions: Record<string, Session> = {};

  // minimal mapping from restaurant_slug to id (re-using public service slugs)
  private restaurants: Record<string, string> = {
    'la-buena-mesa': 'r_1',
    'green-bites': 'r_2',
  };

  createGuestSession(dto: CreateSessionDto): Session {
    const token = this.generateToken();
    const ttlSeconds = 60 * 60 * 24; // 24h by default
    const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const restaurant_id = this.restaurants[dto.restaurant_slug] || `unknown:${dto.restaurant_slug}`;
    const session: Session = {
      token,
      expires_at: expires,
      context: { restaurant_id, table_id: dto.table_code ? String(dto.table_code) : undefined },
    };

    this.sessions[token] = session;
    return session;
  }

  refreshSession(token: string): Session | null {
    const s = this.sessions[token];
    if (!s) return null;
    const ttlSeconds = 60 * 60 * 24; // extend 24h
    s.expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    this.sessions[token] = s;
    return s;
  }

  deleteSession(token: string): boolean {
    if (this.sessions[token]) {
      delete this.sessions[token];
      return true;
    }
    return false;
  }

  validateToken(token: string): Session | null {
    const s = this.sessions[token];
    if (!s) return null;
    if (new Date(s.expires_at) < new Date()) {
      delete this.sessions[token];
      return null;
    }
    return s;
  }

  private generateToken(): string {
    // simple random token
    return require('crypto').randomBytes(24).toString('hex');
  }
}
