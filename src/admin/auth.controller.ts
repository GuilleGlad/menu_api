import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { AdminLoginDto } from './dto/login.dto';
import { AdminAuthService } from './auth.service';
import { AdminRefreshDto } from './dto/refresh.dto';
import { AdminLogoutDto } from './dto/logout.dto';
import { AdminOidcService } from './oidc.service';
import type { Response } from 'express';

@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(
    private readonly service: AdminAuthService,
    private readonly oidc: AdminOidcService,
  ) {}

  @Post('login')
  login(@Body() body: AdminLoginDto) {
    return this.service.validateAndLogin(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: AdminRefreshDto) {
    return this.service.refresh(body.refresh_token);
  }

  @Post('logout')
  logout(@Body() body: AdminLogoutDto) {
    return this.service.logout(body.refresh_token);
  }

  // OIDC: start flow -> returns authorize URL (302 redirect if res provided)
  @Get('oidc/:provider/start')
  oidcStart(@Param('provider') provider: string, @Res() res: Response) {
    const { authorizeUrl } = this.oidc.start(provider);
    return res.redirect(authorizeUrl);
  }

  // OIDC: callback handler -> exchanges code for tokens and returns app tokens
  @Get('oidc/:provider/callback')
  async oidcCallback(
    @Param('provider') provider: string,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return this.oidc.callback(provider, { code, state, error });
  }
}
