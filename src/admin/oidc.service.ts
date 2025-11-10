import { Injectable, UnauthorizedException } from '@nestjs/common';
// NOTE: OIDC requires the 'openid-client' package; install before using in production.
// For now we type minimal interfaces to avoid runtime dependency until installed.
// Replace these stubs by installing: npm install openid-client
interface IssuerLike {
  Client: any;
  metadata?: any;
}
declare const require: any; // allow dynamic require attempt
let generators: any, Issuer: any, Client: any;
try {
  const oidc = require('openid-client');
  generators = oidc.generators;
  Issuer = oidc.Issuer;
  Client = oidc.Client;
} catch (_) {
  generators = {
    state: () => Math.random().toString(36).slice(2),
    nonce: () => Math.random().toString(36).slice(2),
  };
  Issuer = {
    discover: async (_url: string) => ({
      Client: class {
        constructor(_cfg: any) {}
        callback() {
          throw new Error('openid-client not installed');
        }
      },
      metadata: {},
    }),
  };
  Client = class {
    constructor(_cfg: any) {}
    callback() {
      throw new Error('openid-client not installed');
    }
  };
}
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { AdminAuthService } from './auth.service';

interface ProviderConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
}

@Injectable()
export class AdminOidcService {
  private providers: Record<string, ProviderConfig> = {
    // Example config; replace with env-driven real values
    google: {
      issuerUrl: 'https://accounts.google.com',
      clientId: process.env.OIDC_GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.OIDC_GOOGLE_CLIENT_SECRET,
      redirectUri:
        process.env.OIDC_GOOGLE_REDIRECT ||
        'http://localhost:3000/v1/admin/auth/oidc/google/callback',
      scope: 'openid email profile',
    },
  };

  private issuerCache = new Map<string, IssuerLike>();
  private clientCache = new Map<string, any>();
  private stateStore = new Map<string, { provider: string; nonce: string }>();
  private stateTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly auth: AdminAuthService,
  ) {}

  private async getClient(provider: string): Promise<any> {
    if (this.clientCache.has(provider)) return this.clientCache.get(provider)!;
    const cfg = this.providers[provider];
    if (!cfg) throw new UnauthorizedException('unknown_provider');
    let issuer = this.issuerCache.get(provider);
    if (!issuer) {
      const discovered = await Issuer.discover(cfg.issuerUrl);
      issuer = discovered as IssuerLike;
      this.issuerCache.set(provider, issuer);
    }
    const client = new (issuer as any).Client({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uris: [cfg.redirectUri],
      response_types: ['code'],
    });
    this.clientCache.set(provider, client);
    return client;
  }

  start(provider: string) {
    const cfg = this.providers[provider];
    if (!cfg) throw new UnauthorizedException('unknown_provider');
    const state = generators.state();
    const nonce = generators.nonce();
    this.stateStore.set(state, { provider, nonce });
    setTimeout(() => this.stateStore.delete(state), this.stateTtlMs);
    return { authorizeUrl: this.buildAuthorizeUrl(provider, state, nonce) };
  }

  private buildAuthorizeUrl(provider: string, state: string, nonce: string) {
    const cfg = this.providers[provider];
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      response_type: 'code',
      scope: cfg.scope,
      redirect_uri: cfg.redirectUri,
      state,
      nonce,
    });
    return `${cfg.issuerUrl}/o/oauth2/v2/auth?${params.toString()}`;
  }

  async callback(
    provider: string,
    params: { code?: string; state?: string; error?: string },
  ) {
    if (params.error) throw new UnauthorizedException(params.error);
    const { state, code } = params;
    if (!state || !code) throw new UnauthorizedException('missing_params');
    const stored = this.stateStore.get(state);
    if (!stored || stored.provider !== provider)
      throw new UnauthorizedException('invalid_state');
    this.stateStore.delete(state);
    const client = await this.getClient(provider);
    const cfg = this.providers[provider];
    const tokenSet = await client.callback(
      cfg.redirectUri,
      { code, state },
      { nonce: stored.nonce, state },
    );
    const claims = tokenSet.claims();
    const email = claims.email as string | undefined;
    if (!email) throw new UnauthorizedException('email_required');
    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      // auto-provision limited admin account (viewer role by default)
      user = this.usersRepo.create({
        username: email.split('@')[0],
        email,
        password_hash: 'oidc',
        role: 'client',
      });
      await this.usersRepo.save(user);
    }
    return this.auth.issueTokensForUser(user);
  }
}
