import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminAuthService {
  // Simple in-memory refresh token store for dev/testing
  private readonly refreshTokens = new Map<
    string,
    { userId: string; expiresAt: number }
  >();
  private readonly refreshTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  private async issueTokens(user: UserEntity) {
    const payload = { sub: user.id, role: user.role, email: user.email };
    const access = await this.jwt.signAsync(payload);
    const refresh = randomUUID();
    const now = Date.now();
    this.refreshTokens.set(refresh, {
      userId: user.id,
      expiresAt: now + this.refreshTtlMs,
    });
    return {
      access_token: access,
      refresh_token: refresh,
      token_type: 'Bearer',
      expires_in: 2 * 60 * 60, // seconds (matches JwtModule signOptions)
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // Public wrapper for OIDC and other integrations
  async issueTokensForUser(user: UserEntity) {
    return this.issueTokens(user);
  }

  async validateAndLogin(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('invalid_credentials');
    // NOTE: passwords are stored in plain for testing; replace with bcrypt compare in prod
    if (user.password_hash !== password)
      throw new UnauthorizedException('invalid_credentials');

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const entry = this.refreshTokens.get(refreshToken);
    if (!entry) throw new UnauthorizedException('invalid_refresh_token');
    if (Date.now() > entry.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('expired_refresh_token');
    }
    const user = await this.usersRepo.findOne({ where: { id: entry.userId } });
    if (!user) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('invalid_refresh_token');
    }
    // rotate refresh token
    this.refreshTokens.delete(refreshToken);
    return this.issueTokens(user);
  }

  logout(refreshToken: string) {
    if (this.refreshTokens.has(refreshToken)) {
      this.refreshTokens.delete(refreshToken);
    }
    return { success: true };
  }
}
